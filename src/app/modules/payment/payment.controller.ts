import { PaymentStatus } from '@prisma/client';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { PaymentService } from './payment.service';
import { buildPublicUrl } from '../upload/upload.middleware';

const createPayment = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const result = await PaymentService.createBookingWithPayment({ ...req.body, userId });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Booking created, payment initiated',
    data: result,
  });
});

const submitScreenshot = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  if (!req.file) throw new AppError(httpStatus.BAD_REQUEST, 'Screenshot image required (field "image")');
  const screenshotPath = req.file.filename;
  const screenshotUrl = buildPublicUrl(req, screenshotPath);
  const { transactionRef, paymentMethodId } = req.body;
  const result = await PaymentService.submitScreenshot(
    req.params.id as string,
    userId,
    screenshotPath,
    transactionRef,
    paymentMethodId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Screenshot submitted; awaiting admin approval',
    data: { ...result, screenshotUrl },
  });
});

const approve = catchAsync(async (req, res) => {
  const adminId = (req.user as any)?.id;
  const result = await PaymentService.approvePayment(req.params.id as string, {
    ...req.body,
    adminId,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.payment.status === 'PAID' ? 'Payment fully approved' : 'Partial payment approved',
    data: result,
  });
});

const reject = catchAsync(async (req, res) => {
  const adminId = (req.user as any)?.id;
  const result = await PaymentService.rejectPayment(
    req.params.id as string,
    req.body.adminNote,
    adminId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment rejected',
    data: result,
  });
});

const listAll = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await PaymentService.listAll({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? (status as PaymentStatus) : undefined,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payments retrieved',
    data: result.data,
    meta: result.meta,
  });
});

const listMine = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const result = await PaymentService.listMine(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Your payments',
    data: result,
  });
});

const getOne = catchAsync(async (req, res) => {
  const userId = (req.user as any)?.id;
  const role = (req.user as any)?.role;
  const result = await PaymentService.getOne(
    req.params.id as string,
    userId,
    (role === 'ADMIN' || role === 'MANAGER'),
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment',
    data: result,
  });
});

export const PaymentController = {
  createPayment,
  submitScreenshot,
  approve,
  reject,
  listAll,
  listMine,
  getOne,
};
