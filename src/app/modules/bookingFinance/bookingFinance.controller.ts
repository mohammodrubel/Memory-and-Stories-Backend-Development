import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookingFinanceService } from './bookingFinance.service';

const listAssignments = catchAsync(async (req, res) => {
  const user = req.user as { id: string; role: string };
  const data = await BookingFinanceService.listAssignments(
    req.params.bookingId as string,
    user.id,
    user.role === 'ADMIN' || user.role === 'MANAGER',
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Assignments fetched', data });
});

const createAssignment = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.createAssignment(req.params.bookingId as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Assigned', data });
});

const updateAssignment = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.updateAssignment(
    req.params.bookingId as string,
    req.params.id as string,
    req.body,
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Assignment updated', data });
});

const deleteAssignment = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.deleteAssignment(req.params.bookingId as string, req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Assignment removed', data });
});

const listExpenses = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.listExpenses(req.params.bookingId as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expenses fetched', data });
});

const createExpense = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.createExpense(req.params.bookingId as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Expense added', data });
});

const updateExpense = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.updateExpense(
    req.params.bookingId as string,
    req.params.id as string,
    req.body,
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expense updated', data });
});

const deleteExpense = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.deleteExpense(req.params.bookingId as string, req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expense removed', data });
});

const profit = catchAsync(async (req, res) => {
  const data = await BookingFinanceService.profit(req.params.bookingId as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Profit calculated', data });
});

export const BookingFinanceController = {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  profit,
};
