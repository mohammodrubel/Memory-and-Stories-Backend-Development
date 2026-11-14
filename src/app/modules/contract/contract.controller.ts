import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { ContractService } from './contract.service';

const getTemplate = catchAsync(async (_req, res) => {
  const data = await ContractService.getTemplate();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contract template',
    data,
  });
});

const updateTemplate = catchAsync(async (req, res) => {
  const { title, intro, clauses } = req.body || {};
  if (!Array.isArray(clauses)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'clauses must be an array');
  }
  const data = await ContractService.updateTemplate({
    title,
    intro,
    clauses,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contract template updated',
    data,
  });
});

const getBookingContract = catchAsync(async (req, res) => {
  const bookingId = req.params.bookingId as string;
  const role = (req.user as any)?.role;
  const userId = (req.user as any)?.id;
  const isAdmin = role === 'ADMIN' || role === 'MANAGER';
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not your booking');
  }
  const contract = await ContractService.getBookingContract(bookingId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contract',
    data: contract,
  });
});

const signBookingContract = catchAsync(async (req, res) => {
  const bookingId = req.params.bookingId as string;
  const userId = (req.user as any)?.id;
  const { signatoryName, signatureDataUrl } = req.body || {};
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not your booking');
  }
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;
  const data = await ContractService.signBookingContract({
    bookingId,
    signatoryName,
    signatureDataUrl,
    signedIp: ip,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Contract signed',
    data,
  });
});

export const ContractController = {
  getTemplate,
  updateTemplate,
  getBookingContract,
  signBookingContract,
};
