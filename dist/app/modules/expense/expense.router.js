"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const expense_controller_1 = require("./expense.controller");
const expense_validation_1 = require("./expense.validation");
const router = express_1.default.Router();
// Expenses
router.get('/expenses', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.listExpenses);
router.post('/expenses', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(expense_validation_1.ExpenseCreateSchema), expense_controller_1.ExpenseController.createExpense);
router.patch('/expenses/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(expense_validation_1.ExpenseUpdateSchema), expense_controller_1.ExpenseController.updateExpense);
router.delete('/expenses/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.deleteExpense);
// Incomes
router.get('/incomes', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.listIncomes);
router.post('/incomes', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(expense_validation_1.IncomeCreateSchema), expense_controller_1.ExpenseController.createIncome);
router.patch('/incomes/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(expense_validation_1.IncomeUpdateSchema), expense_controller_1.ExpenseController.updateIncome);
router.delete('/incomes/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.deleteIncome);
// Dashboard
router.get('/summary', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.summary);
router.get('/timeseries', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.timeseries);
router.get('/drafts', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), expense_controller_1.ExpenseController.getDrafts);
router.post('/drafts/confirm', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(expense_validation_1.ConfirmDraftsSchema), expense_controller_1.ExpenseController.confirmDrafts);
exports.ExpenseRoutes = router;
