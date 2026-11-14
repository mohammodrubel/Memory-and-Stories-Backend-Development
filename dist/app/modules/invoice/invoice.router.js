"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const invoice_controller_1 = require("./invoice.controller");
const router = express_1.default.Router();
router.get('/me', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), invoice_controller_1.InvoiceController.getMyInvoices);
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), invoice_controller_1.InvoiceController.getInvoices);
exports.InvoiceRoutes = router;
