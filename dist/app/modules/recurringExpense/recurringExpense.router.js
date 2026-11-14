"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringExpenseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const recurringExpense_controller_1 = require("./recurringExpense.controller");
const recurringExpense_validation_1 = require("./recurringExpense.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), recurringExpense_controller_1.RecurringExpenseController.list);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(recurringExpense_validation_1.RecurringCreateSchema), recurringExpense_controller_1.RecurringExpenseController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(recurringExpense_validation_1.RecurringUpdateSchema), recurringExpense_controller_1.RecurringExpenseController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), recurringExpense_controller_1.RecurringExpenseController.remove);
exports.RecurringExpenseRoutes = router;
