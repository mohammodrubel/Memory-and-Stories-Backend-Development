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
exports.BookingFinanceController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const bookingFinance_service_1 = require("./bookingFinance.service");
const listAssignments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const data = yield bookingFinance_service_1.BookingFinanceService.listAssignments(req.params.bookingId, user.id, user.role === 'ADMIN' || user.role === 'MANAGER');
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Assignments fetched', data });
}));
const createAssignment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.createAssignment(req.params.bookingId, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Assigned', data });
}));
const updateAssignment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.updateAssignment(req.params.bookingId, req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Assignment updated', data });
}));
const deleteAssignment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.deleteAssignment(req.params.bookingId, req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Assignment removed', data });
}));
const listExpenses = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.listExpenses(req.params.bookingId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expenses fetched', data });
}));
const createExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.createExpense(req.params.bookingId, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Expense added', data });
}));
const updateExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.updateExpense(req.params.bookingId, req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expense updated', data });
}));
const deleteExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.deleteExpense(req.params.bookingId, req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Expense removed', data });
}));
const profit = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield bookingFinance_service_1.BookingFinanceService.profit(req.params.bookingId);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Profit calculated', data });
}));
exports.BookingFinanceController = {
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
