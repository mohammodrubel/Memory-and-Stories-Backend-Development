"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingFinanceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const bookingFinance_controller_1 = require("./bookingFinance.controller");
const bookingFinance_validation_1 = require("./bookingFinance.validation");
const router = express_1.default.Router({ mergeParams: true });
// Assignments
router.get('/:bookingId/assignments', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), bookingFinance_controller_1.BookingFinanceController.listAssignments);
router.post('/:bookingId/assignments', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(bookingFinance_validation_1.AssignmentCreateSchema), bookingFinance_controller_1.BookingFinanceController.createAssignment);
router.patch('/:bookingId/assignments/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(bookingFinance_validation_1.AssignmentUpdateSchema), bookingFinance_controller_1.BookingFinanceController.updateAssignment);
router.delete('/:bookingId/assignments/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), bookingFinance_controller_1.BookingFinanceController.deleteAssignment);
// Expenses
router.get('/:bookingId/expenses', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), bookingFinance_controller_1.BookingFinanceController.listExpenses);
router.post('/:bookingId/expenses', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(bookingFinance_validation_1.ExpenseCreateSchema), bookingFinance_controller_1.BookingFinanceController.createExpense);
router.patch('/:bookingId/expenses/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(bookingFinance_validation_1.ExpenseUpdateSchema), bookingFinance_controller_1.BookingFinanceController.updateExpense);
router.delete('/:bookingId/expenses/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), bookingFinance_controller_1.BookingFinanceController.deleteExpense);
// Profit
router.get('/:bookingId/profit', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), bookingFinance_controller_1.BookingFinanceController.profit);
exports.BookingFinanceRoutes = router;
