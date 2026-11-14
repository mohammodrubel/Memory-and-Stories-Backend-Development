"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Packagerouter = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const package_controller_1 = require("./package.controller");
const router = express_1.default.Router();
// Public reads (storefront browse)
router.get('/', package_controller_1.PackageController.getAllServices);
router.get('/:id', package_controller_1.PackageController.getSingleService);
// Admin-only writes
router.post('/create-package', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), package_controller_1.PackageController.createService);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), package_controller_1.PackageController.updateService);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), package_controller_1.PackageController.deleteService);
exports.Packagerouter = router;
