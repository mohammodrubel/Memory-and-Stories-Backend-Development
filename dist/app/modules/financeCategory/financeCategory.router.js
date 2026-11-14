"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const financeCategory_controller_1 = require("./financeCategory.controller");
const financeCategory_validation_1 = require("./financeCategory.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), financeCategory_controller_1.FinanceCategoryController.list);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(financeCategory_validation_1.CategoryCreateSchema), financeCategory_controller_1.FinanceCategoryController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(financeCategory_validation_1.CategoryUpdateSchema), financeCategory_controller_1.FinanceCategoryController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), financeCategory_controller_1.FinanceCategoryController.remove);
exports.FinanceCategoryRoutes = router;
