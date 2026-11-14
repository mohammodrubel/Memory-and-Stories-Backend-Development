"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const inquiry_controller_1 = require("./inquiry.controller");
const inquiry_validation_1 = require("./inquiry.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.default)(inquiry_validation_1.InquiryValidation.createInquirySchema), inquiry_controller_1.InquiryController.create);
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), inquiry_controller_1.InquiryController.list);
router.patch('/:id/status', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(inquiry_validation_1.InquiryValidation.updateStatusSchema), inquiry_controller_1.InquiryController.updateStatus);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), inquiry_controller_1.InquiryController.remove);
exports.InquiryRoutes = router;
