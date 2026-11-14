import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FinanceCategoryService } from './financeCategory.service';

const list = catchAsync(async (req, res) => {
  const type = req.query.type as 'EXPENSE' | 'INCOME' | undefined;
  const includeArchived = req.query.includeArchived === 'true';
  const data = await FinanceCategoryService.list(
    type === 'EXPENSE' || type === 'INCOME' ? type : undefined,
    includeArchived,
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Categories fetched', data });
});

const create = catchAsync(async (req, res) => {
  const data = await FinanceCategoryService.create(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Category created', data });
});

const update = catchAsync(async (req, res) => {
  const data = await FinanceCategoryService.update(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await FinanceCategoryService.remove(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category deleted', data });
});

export const FinanceCategoryController = { list, create, update, remove };
