"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const staff_controller_1 = require("./staff.controller");
const staff_validation_1 = require("./staff.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), staff_controller_1.StaffController.list);
router.get('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), staff_controller_1.StaffController.get);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(staff_validation_1.StaffCreateSchema), staff_controller_1.StaffController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(staff_validation_1.StaffUpdateSchema), staff_controller_1.StaffController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), staff_controller_1.StaffController.remove);
exports.StaffRoutes = router;
