"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const expense_service_1 = require("./expense.service");
const listExpenses = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.listExpenses({
        from: req.query.from,
        to: req.query.to,
        categoryId: req.query.categoryId,
        staffId: req.query.staffId,
    });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expenses fetched', data });
}));
const createExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.createExpense(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Expense created', data });
}));
const updateExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.updateExpense(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expense updated', data });
}));
const deleteExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.deleteExpense(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expense deleted', data });
}));
const listIncomes = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.listIncomes({
        from: req.query.from,
        to: req.query.to,
        categoryId: req.query.categoryId,
    });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Incomes fetched', data });
}));
const createIncome = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.createIncome(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Income created', data });
}));
const updateIncome = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.updateIncome(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Income updated', data });
}));
const deleteIncome = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.deleteIncome(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Income deleted', data });
}));
const summary = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.summary(req.query.from, req.query.to);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Summary fetched', data });
}));
const timeseries = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groupBy = req.query.groupBy || 'month';
    const data = yield expense_service_1.ExpenseService.timeseries(req.query.from, req.query.to, groupBy);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Timeseries fetched', data });
}));
const getDrafts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const month = req.query.month ||
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const data = yield expense_service_1.ExpenseService.getDrafts(month);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Drafts fetched', data });
}));
const confirmDrafts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield expense_service_1.ExpenseService.confirmDrafts(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Drafts confirmed', data });
}));
exports.ExpenseController = {
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
