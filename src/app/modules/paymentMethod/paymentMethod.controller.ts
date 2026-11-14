import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { PaymentMethodService } from './paymentMethod.service';

const create = catchAsync(async (req, res) => {
  const result = await PaymentMethodService.createPaymentMethod(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment method created',
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const result = await PaymentMethodService.updatePaymentMethod(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment method updated',
    data: result,
  });
});

const remove = catchAsync(async (req, res) => {
  await PaymentMethodService.deletePaymentMethod(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment method deleted',
    data: null,
  });
});

const listActive = catchAsync(async (_req, res) => {
  const result = await PaymentMethodService.getActivePaymentMethods();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Active payment methods',
    data: result,
  });
});

const listAll = catchAsync(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const result = await PaymentMethodService.getAllPaymentMethods({ includeInactive });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment methods',
    data: result,
  });
});

const getOne = catchAsync(async (req, res) => {
  const result = await PaymentMethodService.getSinglePaymentMethod(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment method',
    data: result,
  });
});

export const PaymentMethodController = { create, update, remove, listActive, listAll, getOne };
