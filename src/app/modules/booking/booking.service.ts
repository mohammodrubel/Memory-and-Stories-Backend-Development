import { BookingStatus, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { DiscountService } from '../discount/discount.service';
import { computeDiscountAmount } from '../discount/discount.calc';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

export interface IBookingSearchOptions {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: BookingStatus;
  userId?: string;
}

export interface IBookingEventInput {
  packageDayId?: string | null;
  eventTypeId: string;
  date: string | Date;
  venue?: string | null;
  notes?: string | null;
}

export interface ICreateBookingPayload {
  userId: string;
  serviceId: string;
  date: string | Date;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  events?: IBookingEventInput[];
  couponCode?: string;
  adminId?: string;
}

const createBooking = async (payload: ICreateBookingPayload) => {
  return prisma.$transaction(async (tx) => {
    // Resolve service amount for subtotal
    const service = await tx.service.findUnique({
      where: { id: payload.serviceId },
      select: { id: true, amount: true },
    });
    if (!service) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
    const subtotal = service.amount;

    const booking = await tx.booking.create({
      data: {
        userId: payload.userId,
        serviceId: payload.serviceId,
        date: new Date(payload.date),
        subtotal,
        discountAmount: 0,
        totalAmount: subtotal,
        customerName: payload.customerName || null,
        customerEmail: payload.customerEmail || null,
        customerPhone: payload.customerPhone || null,
        notes: payload.notes || null,
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
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, title: true, amount: true } },
        events: { include: { eventType: true }, orderBy: { sortOrder: 'asc' } },
        bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
      },
    });

    if (subtotal > 0) {
      const { discountAmount, applied } = await DiscountService.applyAtBookingCreation({
        tx,
        bookingId: booking.id,
        serviceId: payload.serviceId,
        subtotal,
        userId: payload.userId,
        couponCode: payload.couponCode,
        adminId: payload.adminId ?? payload.userId,
      });

      if (applied) {
        const totalAmount = subtotal - discountAmount;
        await tx.booking.update({
          where: { id: booking.id },
          data: { discountAmount, totalAmount },
        });
        return { ...booking, discountAmount, totalAmount };
      }
    }

    return booking;
  });
};

const getAllBookings = async (options: IBookingSearchOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    userId,
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: Prisma.BookingWhereInput = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (searchTerm) {
    where.OR = [
      { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      { service: { title: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, title: true, amount: true } },
        payment: {
          include: {
            paymentMethod: true,
            invoices: { orderBy: { createdAt: 'desc' } },
          },
        },
        events: {
          include: { eventType: true },
          orderBy: { sortOrder: 'asc' },
        },
        bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getSingleBooking = async (id: string) => {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: true,
      events: { include: { eventType: true }, orderBy: { sortOrder: 'asc' } },
      bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
    },
  });
};

const updateBooking = async (
  id: string,
  payload: { status?: BookingStatus; date?: string | Date },
) => {
  const data: Prisma.BookingUpdateInput = {};
  if (payload.status) data.status = payload.status;
  if (payload.date) data.date = new Date(payload.date);
  return prisma.booking.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, title: true, amount: true } },
      bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
    },
  });
};

const deleteBooking = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    // Fetch the BookingDiscount before deleting the booking
    // If discountId is set, decrement usageCount on the Discount
    const bd = await tx.bookingDiscount.findUnique({ where: { bookingId: id } });
    if (bd?.discountId) {
      await tx.discount.update({
        where: { id: bd.discountId },
        data: { usageCount: { decrement: 1 } },
      });
    }
    // Now delete the booking (cascade will remove BookingDiscount)
    return tx.booking.delete({ where: { id } });
  });
};

const markDelivered = async (
  id: string,
  payload: {
    folderId: string;
    folderName?: string | null;
    printLimit?: number | null;
  },
) => {
  const data: any = {
    deliveryFolderId: payload.folderId,
    deliveryFolderName: payload.folderName || null,
    deliveredAt: new Date(),
    status: 'DELIVERED',
  };
  if (typeof payload.printLimit === 'number' && payload.printLimit >= 0) {
    data.printLimit = payload.printLimit;
  }
  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, title: true } },
      bookingDiscount: { include: { discount: { select: { code: true, name: true } } } },
    },
  });
  if (typeof data.printLimit === 'number') {
    await syncEditableRequests(id, data.printLimit);
  }

  // Snapshot: make folder public + cache tree to DB
  try {
    const { setFolderPublic, snapshotDeliveryTree } = await import(
      '../googleDrive/googleDrive.service'
    );
    await setFolderPublic(payload.folderId);
    const rows = await snapshotDeliveryTree(
      payload.folderId,
      payload.folderName || 'Delivery',
    );
    await prisma.deliveryFile.deleteMany({ where: { bookingId: id } });
    if (rows.length) {
      await prisma.deliveryFile.createMany({
        data: rows.map((r) => ({
          bookingId: id,
          fileId: r.fileId,
          fileName: r.fileName,
          mimeType: r.mimeType,
          size: r.size,
          isFolder: r.isFolder,
          parentFolderId: r.parentFolderId,
          parentFolderName: r.parentFolderName,
        })),
        skipDuplicates: true,
      });
    }
  } catch (e) {
    console.warn('[deliver] snapshot failed:', (e as Error).message);
  }

  return booking;
};

async function syncEditableRequests(bookingId: string, newLimit: number) {
  // Mirror new limit onto any editable request for this booking
  await prisma.printRequest.updateMany({
    where: {
      bookingId,
      status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
    },
    data: { maxPhotos: newLimit },
  });
  // If new limit < current selections, trim oldest selections to fit
  const editables = await prisma.printRequest.findMany({
    where: {
      bookingId,
      status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
    },
    include: { selections: { orderBy: { createdAt: 'asc' } } },
  });
  for (const req of editables) {
    if (req.selections.length > newLimit) {
      const toDelete = req.selections.slice(0, req.selections.length - newLimit);
      await prisma.printSelection.deleteMany({
        where: { id: { in: toDelete.map((s) => s.id) } },
      });
    }
  }
}

const refreshSnapshot = async (id: string) => {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error('Booking not found');
  if (!booking.deliveryFolderId) throw new Error('Booking not delivered');
  const { setFolderPublic, snapshotDeliveryTree } = await import(
    '../googleDrive/googleDrive.service'
  );
  await setFolderPublic(booking.deliveryFolderId);
  const rows = await snapshotDeliveryTree(
    booking.deliveryFolderId,
    booking.deliveryFolderName || 'Delivery',
  );
  await prisma.deliveryFile.deleteMany({ where: { bookingId: id } });
  if (rows.length) {
    await prisma.deliveryFile.createMany({
      data: rows.map((r) => ({
        bookingId: id,
        fileId: r.fileId,
        fileName: r.fileName,
        mimeType: r.mimeType,
        size: r.size,
        isFolder: r.isFolder,
        parentFolderId: r.parentFolderId,
        parentFolderName: r.parentFolderName,
      })),
      skipDuplicates: true,
    });
  }
  return { count: rows.length };
};

interface IAdHocInput {
  type: 'FLAT' | 'PERCENT';
  value: number;
  reason: string;
  adminId: string;
}

const applyAdHocDiscount = async (bookingId: string, input: IAdHocInput) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, bookingDiscount: true },
    });
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

    if (booking.bookingDiscount) {
      // if previous was AUTO_SALE/COUPON, decrement usageCount
      if (booking.bookingDiscount.discountId) {
        await tx.discount.update({
          where: { id: booking.bookingDiscount.discountId },
          data: { usageCount: { decrement: 1 } },
        });
      }
      await tx.bookingDiscount.delete({ where: { bookingId } });
    }

    const amount = computeDiscountAmount({
      subtotal: booking.subtotal,
      type: input.type,
      value: input.value,
    });

    await tx.bookingDiscount.create({
      data: {
        bookingId,
        discountId: null,
        source: 'AD_HOC',
        type: input.type,
        value: input.value,
        amount,
        reason: input.reason,
        appliedById: input.adminId,
      },
    });

    const newTotal = +(booking.subtotal - amount).toFixed(2);
    await tx.booking.update({
      where: { id: bookingId },
      data: { discountAmount: amount, totalAmount: newTotal },
    });

    if (booking.payment) {
      const paid = booking.payment.paidAmount ?? 0;
      const refundDue = paid > newTotal ? +(paid - newTotal).toFixed(2) : 0;
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { totalAmount: newTotal, refundDueAmount: refundDue },
      });
    }

    return { bookingId, discountAmount: amount, totalAmount: newTotal };
  });
};

const removeBookingDiscount = async (bookingId: string) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, bookingDiscount: true },
    });
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    if (!booking.bookingDiscount) {
      return { bookingId, discountAmount: 0, totalAmount: booking.subtotal };
    }

    if (booking.bookingDiscount.discountId) {
      await tx.discount.update({
        where: { id: booking.bookingDiscount.discountId },
        data: { usageCount: { decrement: 1 } },
      });
    }
    await tx.bookingDiscount.delete({ where: { bookingId } });

    const newTotal = booking.subtotal;
    await tx.booking.update({
      where: { id: bookingId },
      data: { discountAmount: 0, totalAmount: newTotal },
    });
    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { totalAmount: newTotal, refundDueAmount: 0 },
      });
    }
    return { bookingId, discountAmount: 0, totalAmount: newTotal };
  });
};

const setPrintLimit = async (id: string, printLimit: number) => {
  const booking = await prisma.booking.update({
    where: { id },
    data: { printLimit },
  });
  await syncEditableRequests(id, printLimit);
  return booking;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  markDelivered,
  setPrintLimit,
  refreshSnapshot,
  applyAdHocDiscount,
  removeBookingDiscount,
};
