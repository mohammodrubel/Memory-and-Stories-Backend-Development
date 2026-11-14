import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
// Drive service no longer needed at read path — public URLs used directly
import { subscribe } from '../../utils/notifier';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';

async function resolveUserFromToken(req: any) {
  const token =
    (req.query.token as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new AppError(httpStatus.UNAUTHORIZED, 'token required');
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(
      token,
      config.jwt_access_token_secret as string,
    ) as JwtPayload;
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'invalid token');
  }
  const email = (decoded as any).email;
  if (!email) throw new AppError(httpStatus.UNAUTHORIZED, 'invalid token');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(httpStatus.UNAUTHORIZED, 'user not found');
  return user;
}

async function getOwnedBooking(req: any, bookingId: string) {
  let userId = req.user?.id;
  let role = req.user?.role;
  if (!userId) {
    const u = await resolveUserFromToken(req);
    userId = u.id;
    role = u.role;
  }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (role !== 'ADMIN' && role !== 'MANAGER' && booking.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not your booking');
  }
  if (!booking.deliveryFolderId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Not delivered yet');
  }
  return booking;
}

const myDeliveries = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const role = (req.user as any)?.role;
  const where: any = { deliveredAt: { not: null } };
  if (role !== 'ADMIN' && role !== 'MANAGER') where.userId = userId;
  const data = await prisma.booking.findMany({
    where,
    orderBy: { deliveredAt: 'desc' },
    select: {
      id: true,
      date: true,
      deliveredAt: true,
      deliveryFolderName: true,
      status: true,
      service: { select: { id: true, title: true } },
    },
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Deliveries retrieved',
    data,
  });
});

const getDelivery = catchAsync(async (req, res) => {
  const booking = await getOwnedBooking(req, req.params.bookingId as string);
  const folderId = (req.query.folderId as string) || booking.deliveryFolderId!;

  // Validate folderId is within delivery tree (DB-only check)
  if (folderId !== booking.deliveryFolderId) {
    const f = await prisma.deliveryFile.findFirst({
      where: { bookingId: booking.id, fileId: folderId, isFolder: true },
    });
    if (!f) {
      throw new AppError(httpStatus.FORBIDDEN, 'Folder not in delivery tree');
    }
  }

  const files = await prisma.deliveryFile.findMany({
    where: { bookingId: booking.id, parentFolderId: folderId },
    orderBy: [{ isFolder: 'desc' }, { fileName: 'asc' }],
  });

  // Active editable print request for this owner (if any)
  const userId = (req.user as any)?.id || (req as any).resolvedUserId;
  let activePrintRequest = null;
  if (userId && userId === booking.userId) {
    activePrintRequest = await prisma.printRequest.findFirst({
      where: {
        bookingId: booking.id,
        userId,
        status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
      },
      include: { selections: { select: { fileId: true } } },
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Delivery retrieved',
    data: {
      booking: {
        id: booking.id,
        deliveredAt: booking.deliveredAt,
        folderName: booking.deliveryFolderName,
        printLimit: booking.printLimit ?? 0,
      },
      currentFolderId: folderId,
      isRoot: folderId === booking.deliveryFolderId,
      files: files.map((f) => ({
        id: f.fileId,
        name: f.fileName,
        mimeType: f.mimeType,
        size: f.size,
      })),
      nextPageToken: null,
      activePrintRequest: activePrintRequest
        ? {
            id: activePrintRequest.id,
            status: activePrintRequest.status,
            maxPhotos: activePrintRequest.maxPhotos,
            selectedFileIds: activePrintRequest.selections.map((s) => s.fileId),
          }
        : null,
    },
  });
});

const downloadFile = catchAsync(async (req, res) => {
  const booking = await getOwnedBooking(req, req.params.bookingId as string);
  const fileId = req.params.fileId as string;
  const row = await prisma.deliveryFile.findFirst({
    where: { bookingId: booking.id, fileId },
  });
  if (!row) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not in delivery');
  }
  const wantsDownload = req.query.download === '1';
  const url = wantsDownload
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : `https://drive.google.com/uc?export=view&id=${fileId}`;
  return res.redirect(url);
});

const thumbnail = catchAsync(async (req, res) => {
  const booking = await getOwnedBooking(req, req.params.bookingId as string);
  const fileId = req.params.fileId as string;
  const row = await prisma.deliveryFile.findFirst({
    where: { bookingId: booking.id, fileId },
  });
  if (!row) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not in delivery');
  }
  // Drive public thumbnail endpoint — no token, no expiry
  return res.redirect(
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
  );
});

const stream = catchAsync(async (req, res) => {
  const user = await resolveUserFromToken(req);
  subscribe(user.id, res);
});

export const DeliveryController = {
  myDeliveries,
  getDelivery,
  downloadFile,
  thumbnail,
  stream,
};
