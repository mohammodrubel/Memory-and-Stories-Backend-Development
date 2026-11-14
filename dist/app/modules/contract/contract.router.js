"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const contract_controller_1 = require("./contract.controller");
const router = express_1.default.Router();
// Template
router.get('/template', contract_controller_1.ContractController.getTemplate);
router.put('/template', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), contract_controller_1.ContractController.updateTemplate);
// Per-booking
router.get('/booking/:bookingId', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), contract_controller_1.ContractController.getBookingContract);
router.post('/booking/:bookingId/sign', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), contract_controller_1.ContractController.signBookingContract);
exports.ContractRoutes = router;
