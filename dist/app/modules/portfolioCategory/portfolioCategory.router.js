"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const portfolioCategory_controller_1 = require("./portfolioCategory.controller");
const portfolioCategory_validation_1 = require("./portfolioCategory.validation");
const router = express_1.default.Router();
router.get('/', portfolioCategory_controller_1.PortfolioCategoryController.list);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(portfolioCategory_validation_1.PortfolioCategoryValidation.createSchema), portfolioCategory_controller_1.PortfolioCategoryController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(portfolioCategory_validation_1.PortfolioCategoryValidation.updateSchema), portfolioCategory_controller_1.PortfolioCategoryController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), portfolioCategory_controller_1.PortfolioCategoryController.remove);
exports.PortfolioCategoryRoutes = router;
