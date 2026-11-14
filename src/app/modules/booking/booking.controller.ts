import { BookingStatus, Role } from '@prisma/client';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { BookingService } from './booking.service';

const createBooking = catchAsync(async (req, res) => {
  // Only authed user id from token — never body — to prevent owner spoofing
  const userId = (req.user as any)?.id;
  if (!userId)
    throw new AppError(httpStatus.UNAUTHORIZED, 'Not authenticated');
  const result = await BookingService.createBooking({
    ...req.body,
    userId,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Booking created successfully',
    data: result,
  });
});

const getAllBookings = catchAsync(async (req, res) => {
  // Admin-only route — userId query filter allowed
  const { search, page, limit, sortBy, sortOrder, status, userId } = req.query;
  const result = await BookingService.getAllBookings({
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    status: status ? (status as BookingStatus) : undefined,
    userId: userId as string,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMyBookings = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const { page, limit, status } = req.query;
  const result = await BookingService.getAllBookings({
    userId,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? (status as BookingStatus) : undefined,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Your bookings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleBooking = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const role = (req.user as any)?.role;
  const result = await BookingService.getSingleBooking(req.params.id as string);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  // Owner check: USER can only see own; ADMIN sees any
  if (role !== Role.ADMIN && role !== Role.MANAGER && result.userId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, 'Not your booking');
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const result = await BookingService.updateBooking(req.params.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking updated successfully',
    data: result,
  });
});

const deliverBooking = catchAsync(async (req, res) => {
  const { folderId, folderName, printLimit } = req.body || {};
  if (!folderId || typeof folderId !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'folderId required');
  }
  const result = await BookingService.markDelivered(req.params.id as string, {
    folderId,
    folderName,
    printLimit:
      typeof printLimit === 'number' && printLimit >= 0
        ? Math.floor(printLimit)
        : undefined,
  });
  // Persist notification (durable) — service also emits SSE
  try {
    const { createNotification } = await import(
      '../notification/notification.service'
    );
    await createNotification({
      userId: result.userId,
      type: 'delivery.ready',
      title: `Your ${result.service?.title || 'booking'} is ready`,
      body: result.deliveryFolderName || null,
      data: {
        bookingId: result.id,
        link: `/dashboard/user/deliveries/${result.id}`,
        folderName: result.deliveryFolderName,
        deliveredAt: result.deliveredAt,
      },
    });
  } catch (e) {
    console.warn('[deliver] notify failed:', (e as Error).message);
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking marked delivered',
    data: result,
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  const result = await BookingService.deleteBooking(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking deleted successfully',
    data: result,
  });
});

const setPrintLimit = catchAsync(async (req, res) => {
  const { printLimit } = req.body || {};
  const n = Number(printLimit);
  if (!Number.isFinite(n) || n < 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'printLimit must be >= 0');
  }
  const result = await BookingService.setPrintLimit(
    req.params.id as string,
    Math.floor(n),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Print limit updated',
    data: result,
  });
});

const refreshSnapshot = catchAsync(async (req, res) => {
  const result = await BookingService.refreshSnapshot(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Snapshot refreshed',
    data: result,
  });
});

const applyAdHocDiscount = catchAsync(async (req, res) => {
  const result = await BookingService.applyAdHocDiscount(req.params.id as string, {
    ...req.body,
    adminId: (req as any).user.id,
  });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Discount applied', data: result });
});

const removeBookingDiscount = catchAsync(async (req, res) => {
  const result = await BookingService.removeBookingDiscount(req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Discount removed', data: result });
});

export const BookingController = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  deliverBooking,
  setPrintLimit,
  refreshSnapshot,
  applyAdHocDiscount,
  removeBookingDiscount,
};
