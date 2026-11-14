import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RecurringExpenseService } from './recurringExpense.service';

const list = catchAsync(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const data = await RecurringExpenseService.list(includeInactive);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Recurring fetched', data });
});

const create = catchAsync(async (req, res) => {
  const data = await RecurringExpenseService.create(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Recurring created', data });
});

const update = catchAsync(async (req, res) => {
  const data = await RecurringExpenseService.update(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Recurring updated', data });
});

const remove = catchAsync(async (req, res) => {
  const data = await RecurringExpenseService.remove(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Recurring deleted', data });
});

export const RecurringExpenseController = { list, create, update, remove };
