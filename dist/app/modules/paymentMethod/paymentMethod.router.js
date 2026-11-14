"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const paymentMethod_controller_1 = require("./paymentMethod.controller");
const paymentMethod_validation_1 = require("./paymentMethod.validation");
const router = express_1.default.Router();
// Public: active methods only (shown to customer at pay step)
router.get('/active', paymentMethod_controller_1.PaymentMethodController.listActive);
// Admin
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), paymentMethod_controller_1.PaymentMethodController.listAll);
router.get('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), paymentMethod_controller_1.PaymentMethodController.getOne);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(paymentMethod_validation_1.PaymentMethodValidation.createSchema), paymentMethod_controller_1.PaymentMethodController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(paymentMethod_validation_1.PaymentMethodValidation.updateSchema), paymentMethod_controller_1.PaymentMethodController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), paymentMethod_controller_1.PaymentMethodController.remove);
exports.PaymentMethodRoutes = router;
