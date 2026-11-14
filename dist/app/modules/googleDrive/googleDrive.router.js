"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const googleDrive_controller_1 = require("./googleDrive.controller");
const router = express_1.default.Router();
router.get('/connect', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), googleDrive_controller_1.GoogleDriveController.connect);
router.get('/callback', googleDrive_controller_1.GoogleDriveController.callback);
router.get('/status', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), googleDrive_controller_1.GoogleDriveController.status);
router.delete('/disconnect', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), googleDrive_controller_1.GoogleDriveController.disconnect);
router.get('/picker-token', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), googleDrive_controller_1.GoogleDriveController.pickerToken);
exports.GoogleDriveRoutes = router;
