"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const calendar_controller_1 = require("./calendar.controller");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), calendar_controller_1.CalendarController.listRange);
router.post('/booking/:id/push', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), calendar_controller_1.CalendarController.push);
router.delete('/booking/:id/push', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), calendar_controller_1.CalendarController.remove);
exports.CalendarRoutes = router;
