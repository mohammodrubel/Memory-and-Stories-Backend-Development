"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const product_controller_1 = require("./product.controller");
const product_validation_1 = require("./product.validation");
const router = express_1.default.Router();
router.post('/create-product', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(product_validation_1.ProductValidation.createProductSchema), product_controller_1.ProductController.createProduct);
router.get('/', product_controller_1.ProductController.getAllProducts);
router.get('/:id', product_controller_1.ProductController.getSingleProduct);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(product_validation_1.ProductValidation.updateProductSchema), product_controller_1.ProductController.updateProduct);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), product_controller_1.ProductController.deleteProduct);
exports.ProductRoutes = router;
