import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PhotographerService } from './photographer.service';

const list = catchAsync(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const data = await PhotographerService.list(includeArchived);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Photographers fetched', data });
});

const get = catchAsync(async (req, res) => {
  const data = await PhotographerService.getById(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Photographer fetched', data });
});

const create = catchAsync(async (req, res) => {
  const data = await PhotographerService.create(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Photographer created', data });
});

const update = catchAsync(async (req, res) => {
  const data = await PhotographerService.update(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Photographer updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await PhotographerService.remove(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Photographer deleted', data });
});

export const PhotographerController = { list, get, create, update, remove };
