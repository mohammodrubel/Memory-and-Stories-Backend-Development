import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PortfolioCategoryService } from './portfolioCategory.service';

const list = catchAsync(async (_req, res) => {
  const data = await PortfolioCategoryService.list();
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Categories retrieved', data });
});

const create = catchAsync(async (req, res) => {
  const data = await PortfolioCategoryService.create(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Category created', data });
});

const update = catchAsync(async (req, res) => {
  const data = await PortfolioCategoryService.update(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await PortfolioCategoryService.remove(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category deleted', data });
});

export const PortfolioCategoryController = { list, create, update, remove };
