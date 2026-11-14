import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import type { DiscountKind } from './discount.types';
import { computeDiscountAmount } from './discount.calc';

export interface IValidateCouponInput {
  code: string;
  serviceId: string;
  userId?: string | null;
}

export interface IListFilters {
  kind?: DiscountKind;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

const linkServices = (serviceIds: string[] | undefined) =>
  serviceIds && serviceIds.length
    ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
    : undefined;

const createDiscount = async (
  payload: any,
  adminId: string,
) => {
  const { serviceIds, code, ...rest } = payload;
  return prisma.discount.create({
    data: {
      ...rest,
      code: code ? String(code).toUpperCase() : null,
      createdById: adminId,
      services: linkServices(serviceIds),
    },
    include: { services: true },
  });
};

const listDiscounts = async (filters: IListFilters) => {
  const { kind, active, search, page = 1, limit = 20 } = filters;
  const where: Prisma.DiscountWhereInput = {};
  if (kind) where.kind = kind;
  if (typeof active === 'boolean') where.active = active;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search.toUpperCase() } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      include: { services: true, _count: { select: { redemptions: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discount.count({ where }),
  ]);
  return { items, meta: { page, limit, total } };
};

const getDiscount = async (id: string) => {
  const d = await prisma.discount.findUnique({
    where: { id },
    include: { services: true, _count: { select: { redemptions: true } } },
  });
  if (!d) throw new AppError(httpStatus.NOT_FOUND, 'Discount not found');
  return d;
};

const updateDiscount = async (id: string, payload: any) => {
  const { serviceIds, code, ...rest } = payload;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.discount.findUnique({ where: { id } });
    if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Discount not found');
    if (serviceIds) {
      await tx.discountService.deleteMany({ where: { discountId: id } });
      if (serviceIds.length) {
        await tx.discountService.createMany({
          data: serviceIds.map((serviceId: string) => ({ discountId: id, serviceId })),
        });
      }
    }
    return tx.discount.update({
      where: { id },
      data: { ...rest, code: code === undefined ? undefined : code ? String(code).toUpperCase() : null },
      include: { services: true },
    });
  });
};

const softDeleteDiscount = async (id: string) => {
  return prisma.discount.update({ where: { id }, data: { active: false } });
};

const validateCoupon = async (input: IValidateCouponInput) => {
  const code = input.code.toUpperCase();
  const now = new Date();
  const discount = await prisma.discount.findFirst({
    where: {
      code,
      kind: 'COUPON',
      active: true,
      validFrom: { lte: now },
      validTo: { gte: now },
    },
    include: { services: true },
  });
  if (!discount) {
    return { valid: false as const, reason: 'Invalid or expired coupon' };
  }

  if (discount.services.length > 0 && !discount.services.some((s: any) => s.serviceId === input.serviceId)) {
    return { valid: false as const, reason: 'Coupon not valid for this service' };
  }

  if (discount.usageCap != null && discount.usageCount >= discount.usageCap) {
    return { valid: false as const, reason: 'Coupon usage limit reached' };
  }

  if (input.userId && discount.perCustomerLimit != null) {
    const used = await prisma.bookingDiscount.count({
      where: { discountId: discount.id, booking: { userId: input.userId } },
    });
    if (used >= discount.perCustomerLimit) {
      return { valid: false as const, reason: 'You already used this coupon' };
    }
  }

  const service = await prisma.service.findUnique({ where: { id: input.serviceId }, select: { amount: true } });
  if (!service) return { valid: false as const, reason: 'Service not found' };

  if (discount.minBookingAmount != null && service.amount < discount.minBookingAmount) {
    return {
      valid: false as const,
      reason: `Minimum booking amount ${discount.minBookingAmount} not met`,
    };
  }

  const amount = computeDiscountAmount({
    subtotal: service.amount,
    type: discount.type,
    value: discount.value,
    maxDiscountAmount: discount.maxDiscountAmount,
  });

  return {
    valid: true as const,
    discountId: discount.id,
    type: discount.type,
    value: discount.value,
    amount,
  };
};

interface IApplyInput {
  tx: Prisma.TransactionClient;
  bookingId: string;
  serviceId: string;
  subtotal: number;
  userId: string;
  couponCode?: string | null;
  adminId: string;
}

const resolveAutoSale = async (
  tx: Prisma.TransactionClient,
  serviceId: string,
  subtotal: number,
  now: Date,
) => {
  const candidates = await tx.discount.findMany({
    where: {
      kind: 'AUTO_SALE',
      active: true,
      validFrom: { lte: now },
      validTo: { gte: now },
      OR: [{ services: { none: {} } }, { services: { some: { serviceId } } }],
    },
  });
  if (!candidates.length) return null;
  // Filter out candidates that have hit their usageCap
  const eligible = candidates.filter((d) => d.usageCap == null || d.usageCount < d.usageCap);
  if (!eligible.length) return null;
  const scored = eligible
    .map((d) => ({
      discount: d,
      amount: computeDiscountAmount({
        subtotal,
        type: d.type,
        value: d.value,
        maxDiscountAmount: d.maxDiscountAmount,
      }),
    }))
    .sort((a, b) => b.amount - a.amount);
  const winner = scored[0];
  if (winner.amount <= 0) return null;
  return winner;
};

const applyAtBookingCreation = async (input: IApplyInput) => {
  const { tx, bookingId, serviceId, subtotal, userId, couponCode, adminId } = input;
  const now = new Date();

  const autoSale = await resolveAutoSale(tx, serviceId, subtotal, now);

  let couponCandidate: { discount: any; amount: number } | null = null;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    const d = await tx.discount.findFirst({
      where: {
        code,
        kind: 'COUPON',
        active: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      include: { services: true },
    });
    if (d) {
      const serviceOk = d.services.length === 0 || d.services.some((s: any) => s.serviceId === serviceId);
      const capOk = d.usageCap == null || d.usageCount < d.usageCap;
      const minOk = d.minBookingAmount == null || subtotal >= d.minBookingAmount;
      const perCustOk =
        d.perCustomerLimit == null ||
        (await tx.bookingDiscount.count({ where: { discountId: d.id, booking: { userId } } })) <
          d.perCustomerLimit;
      if (serviceOk && capOk && minOk && perCustOk) {
        const amount = computeDiscountAmount({
          subtotal,
          type: d.type,
          value: d.value,
          maxDiscountAmount: d.maxDiscountAmount,
        });
        if (amount > 0) couponCandidate = { discount: d, amount };
      }
    }
  }

  const winner =
    autoSale && couponCandidate
      ? autoSale.amount >= couponCandidate.amount
        ? { ...autoSale, source: 'AUTO_SALE' as const }
        : { ...couponCandidate, source: 'COUPON' as const }
      : autoSale
      ? { ...autoSale, source: 'AUTO_SALE' as const }
      : couponCandidate
      ? { ...couponCandidate, source: 'COUPON' as const }
      : null;

  if (!winner) return { discountAmount: 0, applied: null as null };

  // Re-read inside transaction to guard against concurrent cap exhaustion
  const fresh = await tx.discount.findUnique({ where: { id: winner.discount.id } });
  if (fresh == null || (fresh.usageCap != null && fresh.usageCount >= fresh.usageCap)) {
    return { discountAmount: 0, applied: null as null };
  }

  const row = await tx.bookingDiscount.create({
    data: {
      bookingId,
      discountId: winner.discount.id,
      source: winner.source,
      type: winner.discount.type,
      value: winner.discount.value,
      amount: winner.amount,
      appliedById: adminId,
    },
  });

  await tx.discount.update({
    where: { id: winner.discount.id },
    data: { usageCount: { increment: 1 } },
  });

  return { discountAmount: winner.amount, applied: row };
};

/**
 * Resolves the best AUTO_SALE discount for a given service and subtotal without a
 * transaction client (uses the global prisma instance). Suitable for read-only
 * display use-cases such as the service list endpoint.
 */
export const resolveAutoSaleForService = async (
  serviceId: string,
  subtotal: number,
): Promise<{ discountId: string; type: string; value: number; amount: number } | null> => {
  const now = new Date();
  const candidates = await prisma.discount.findMany({
    where: {
      kind: 'AUTO_SALE',
      active: true,
      validFrom: { lte: now },
      validTo: { gte: now },
      OR: [{ services: { none: {} } }, { services: { some: { serviceId } } }],
    },
  });
  if (!candidates.length) return null;
  const eligible = candidates.filter((d) => d.usageCap == null || d.usageCount < d.usageCap);
  if (!eligible.length) return null;
  const scored = eligible
    .map((d) => ({
      discount: d,
      amount: computeDiscountAmount({
        subtotal,
        type: d.type,
        value: d.value,
        maxDiscountAmount: d.maxDiscountAmount,
      }),
    }))
    .sort((a, b) => b.amount - a.amount);
  const winner = scored[0];
  if (winner.amount <= 0) return null;
  return {
    discountId: winner.discount.id,
    type: winner.discount.type,
    value: winner.discount.value,
    amount: winner.amount,
  };
};

export const DiscountService = {
  createDiscount,
  listDiscounts,
  getDiscount,
  updateDiscount,
  softDeleteDiscount,
  validateCoupon,
  applyAtBookingCreation,
};
