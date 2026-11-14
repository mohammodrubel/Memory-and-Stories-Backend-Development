"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSettingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const siteSettings_validation_1 = __importDefault(require("./siteSettings.validation"));
const siteSettings_controller_1 = require("./siteSettings.controller");
const router = express_1.default.Router();
router.get('/', siteSettings_controller_1.SiteSettingsController.get);
router.put('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(siteSettings_validation_1.default), siteSettings_controller_1.SiteSettingsController.update);
exports.SiteSettingsRoutes = router;
