"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const delivery_controller_1 = require("./delivery.controller");
const router = express_1.default.Router();
// SSE — token via ?token= because EventSource has no auth header support
router.get('/stream', delivery_controller_1.DeliveryController.stream);
router.get('/me', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), delivery_controller_1.DeliveryController.myDeliveries);
router.get('/:bookingId', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), delivery_controller_1.DeliveryController.getDelivery);
// download + thumbnail: token via ?token= (img/video tags can't send Bearer)
router.get('/:bookingId/files/:fileId', delivery_controller_1.DeliveryController.downloadFile);
router.get('/:bookingId/files/:fileId/thumbnail', delivery_controller_1.DeliveryController.thumbnail);
exports.DeliveryRoutes = router;
