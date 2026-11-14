import { PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { DiscountService } from '../discount/discount.service';

export interface IBookingEventInput {
  packageDayId?: string | null;
  eventTypeId: string;
  date: string | Date;
  venue?: string | null;
  notes?: string | null;
}

export interface ICreatePaymentPayload {
  userId: string;
  serviceId: string;
  date: string | Date;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  events?: IBookingEventInput[];
  couponCode?: string;
}

type TxClient = Prisma.TransactionClient | typeof prisma;

const generateInvoiceNo = async (client: TxClient = prisma) => {
  const year = new Date().getFullYear();
  const count = await client.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const seq = String(count + 1).padStart(5, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${year}-${seq}-${rand}`;
};

const createBookingWithPayment = async (payload: ICreatePaymentPayload) => {
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
    select: { id: true, amount: true, title: true },
  });
  if (!service) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        userId: payload.userId,
        serviceId: payload.serviceId,
        date: new Date(payload.date),
        subtotal: service.amount,
        discountAmount: 0,
        totalAmount: service.amount,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        notes: payload.notes,
        events: payload.events?.length
          ? {
              create: payload.events.map((e, i) => ({
                packageDayId: e.packageDayId || null,
                eventTypeId: e.eventTypeId,
                date: new Date(e.date),
                venue: e.venue || null,
                notes: e.notes || null,
                sortOrder: i,
              })),
            }
          : undefined,
      },
    });

    const { discountAmount, applied } = await DiscountService.applyAtBookingCreation({
      tx,
      bookingId: booking.id,
      serviceId: service.id,
      subtotal: service.amount,
      userId: payload.userId,
      couponCode: payload.couponCode,
      adminId: payload.userId,
    });

    const totalAmount = service.amount - discountAmount;
    if (applied) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { discountAmount, totalAmount },
      });
    }

    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        userId: payload.userId,
        totalAmount,
        status: PaymentStatus.AWAITING_PAYMENT,
      },
    });
    return { booking: { ...booking, discountAmount, totalAmount }, payment, appliedDiscount: applied };
  });
};

const submitScreenshot = async (
  paymentId: string,
  userId: string,
  screenshotPath: string,
  transactionRef?: string,
  paymentMethodId?: string,
) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  if (payment.userId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, 'Not your payment');
  if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.REJECTED)
    throw new AppError(httpStatus.BAD_REQUEST, `Payment already ${payment.status}`);

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      screenshotPath,
      transactionRef,
      paymentMethodId,
      status: PaymentStatus.SCREENSHOT_SUBMITTED,
    },
  });
};

export interface IApprovePayload {
  paidAmount: number; // amount admin confirmed
  adminNote?: string;
  adminId: string;
}

const approvePayment = async (paymentId: string, payload: IApprovePayload) => {
  if (payload.paidAmount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, 'paidAmount must be > 0');

  const runOnce = () =>
    prisma.$transaction(
      async (tx) => {
        // Re-read inside tx to serialize concurrent admin approvals.
        // Postgres SERIALIZABLE isolation surfaces conflicts as P2034 (retry below).
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { booking: true },
        });
        if (!payment) throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
        if (payment.status === PaymentStatus.REJECTED)
          throw new AppError(httpStatus.BAD_REQUEST, 'Payment already rejected');
        if (payment.status === PaymentStatus.PAID)
          throw new AppError(httpStatus.BAD_REQUEST, 'Payment already fully paid');

        const newPaidTotal = +(payment.paidAmount + payload.paidAmount).toFixed(2);
        if (newPaidTotal > payment.totalAmount + 0.0001)
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `paidAmount ${newPaidTotal} exceeds totalAmount ${payment.totalAmount}`,
          );

        const amountDue = +(payment.totalAmount - newPaidTotal).toFixed(2);
        const isPartial = amountDue > 0.0001;
        const newStatus = isPartial ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.PAID;

        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: {
            paidAmount: newPaidTotal,
            status: newStatus,
            adminNote: payload.adminNote,
            approvedAt: new Date(),
            approvedById: payload.adminId,
          },
        });
        const invoiceNo = await generateInvoiceNo(tx);
        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            paymentId,
            userId: payment.userId,
            totalAmount: payment.totalAmount,
            amountPaid: payload.paidAmount,
            amountDue,
            isPartial,
          },
        });
        if (!isPartial) {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
          });
        }
        return { payment: updated, invoice };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

  // Retry on serialization failure (P2034) or unique invoiceNo race (P2002).
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runOnce();
    } catch (e) {
      lastErr = e;
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2034')) {
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
};

const rejectPayment = async (paymentId: string, adminNote: string, adminId: string) => {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.REJECTED,
      adminNote,
      approvedAt: new Date(),
      approvedById: adminId,
    },
  });
};

const listAll = async (opts: { page?: number; limit?: number; status?: PaymentStatus }) => {
  const { page = 1, limit = 10, status } = opts;
  const where: Prisma.PaymentWhereInput = {};
  if (status) where.status = status;
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        booking: {
          include: { service: { select: { title: true, amount: true } } },
        },
        paymentMethod: true,
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.payment.count({ where }),
  ]);
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
};

const listMine = async (userId: string) =>
  prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      booking: { include: { service: { select: { title: true, amount: true } } } },
      paymentMethod: true,
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  });

const getOne = async (id: string, userId: string, isAdmin: boolean) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      booking: { include: { service: true } },
      paymentMethod: true,
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!payment) throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  if (!isAdmin && payment.userId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, 'Not your payment');
  return payment;
};

export const PaymentService = {
  createBookingWithPayment,
  submitScreenshot,
  approvePayment,
  rejectPayment,
  listAll,
  listMine,
  getOne,
  generateInvoiceNo,
};
