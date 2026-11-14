import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { PrintRequestService } from './printRequest.service';

const init = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const { bookingId } = req.body || {};
  if (!bookingId) throw new AppError(httpStatus.BAD_REQUEST, 'bookingId required');
  const r = await PrintRequestService.getOrCreateDraft(userId, bookingId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Print request',
    data: r,
  });
});

const listMine = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const r = await PrintRequestService.listForUser(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'My print requests',
    data: r,
  });
});

const listAll = catchAsync(async (_req, res) => {
  const r = await PrintRequestService.listAll();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All print requests',
    data: r,
  });
});

const getOne = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const role = (req.user as any).role;
  const isAdmin = role === 'ADMIN' || role === 'MANAGER';
  const r = await PrintRequestService.getOne(
    req.params.id as string,
    userId,
    isAdmin,
  );
  if (!r) throw new AppError(httpStatus.NOT_FOUND, 'Not found');
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Print request',
    data: r,
  });
});

const updateSelections = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const r = await PrintRequestService.updateSelections(
    req.params.id as string,
    userId,
    req.body || {},
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Selections updated',
    data: r,
  });
});

const submit = catchAsync(async (req, res) => {
  const userId = (req.user as any).id;
  const { password } = req.body || {};
  if (!password) throw new AppError(httpStatus.BAD_REQUEST, 'password required');
  const r = await PrintRequestService.submit(
    req.params.id as string,
    userId,
    password,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Print request submitted',
    data: r,
  });
});

const adminAction = (
  action:
    | 'request-changes'
    | 'approve'
    | 'start-printing'
    | 'deliver'
    | 'reject',
) =>
  catchAsync(async (req, res) => {
    const r = await PrintRequestService.adminAction(
      req.params.id as string,
      action,
      req.body || {},
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Print request ${action}`,
      data: r,
    });
  });

export const PrintRequestController = {
  init,
  listMine,
  listAll,
  getOne,
  updateSelections,
  submit,
  requestChanges: adminAction('request-changes'),
  approve: adminAction('approve'),
  startPrinting: adminAction('start-printing'),
  deliver: adminAction('deliver'),
  reject: adminAction('reject'),
};
