import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ExpenseService } from './expense.service';

const listExpenses = catchAsync(async (req, res) => {
  const data = await ExpenseService.listExpenses({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    categoryId: req.query.categoryId as string | undefined,
    staffId: req.query.staffId as string | undefined,
  });
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expenses fetched', data });
});

const createExpense = catchAsync(async (req, res) => {
  const data = await ExpenseService.createExpense(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Expense created', data });
});

const updateExpense = catchAsync(async (req, res) => {
  const data = await ExpenseService.updateExpense(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expense updated', data });
});

const deleteExpense = catchAsync(async (req, res) => {
  const data = await ExpenseService.deleteExpense(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Expense deleted', data });
});

const listIncomes = catchAsync(async (req, res) => {
  const data = await ExpenseService.listIncomes({
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    categoryId: req.query.categoryId as string | undefined,
  });
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Incomes fetched', data });
});

const createIncome = catchAsync(async (req, res) => {
  const data = await ExpenseService.createIncome(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Income created', data });
});

const updateIncome = catchAsync(async (req, res) => {
  const data = await ExpenseService.updateIncome(req.params.id as string, req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Income updated', data });
});

const deleteIncome = catchAsync(async (req, res) => {
  const data = await ExpenseService.deleteIncome(req.params.id as string);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Income deleted', data });
});

const summary = catchAsync(async (req, res) => {
  const data = await ExpenseService.summary(
    req.query.from as string | undefined,
    req.query.to as string | undefined,
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Summary fetched', data });
});

const timeseries = catchAsync(async (req, res) => {
  const groupBy = (req.query.groupBy as 'day' | 'month' | 'year') || 'month';
  const data = await ExpenseService.timeseries(
    req.query.from as string | undefined,
    req.query.to as string | undefined,
    groupBy,
  );
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Timeseries fetched', data });
});

const getDrafts = catchAsync(async (req, res) => {
  const month =
    (req.query.month as string) ||
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const data = await ExpenseService.getDrafts(month);
  sendResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Drafts fetched', data });
});

const confirmDrafts = catchAsync(async (req, res) => {
  const data = await ExpenseService.confirmDrafts(req.body);
  sendResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Drafts confirmed', data });
});

export const ExpenseController = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  summary,
  timeseries,
  getDrafts,
  confirmDrafts,
};
