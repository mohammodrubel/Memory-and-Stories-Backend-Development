import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StaffService } from './staff.service';

const list = catchAsync(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const data = await StaffService.list(includeInactive);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Staff fetched', data });
});

const get = catchAsync(async (req, res) => {
  const data = await StaffService.getById(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Staff fetched', data });
});

const create = catchAsync(async (req, res) => {
  const data = await StaffService.create(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Staff created', data });
});

const update = catchAsync(async (req, res) => {
  const data = await StaffService.update(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Staff updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await StaffService.remove(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Staff deleted', data });
});

export const StaffController = { list, get, create, update, remove };
