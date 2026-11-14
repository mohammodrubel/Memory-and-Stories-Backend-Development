"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const eventType_controller_1 = require("./eventType.controller");
const router = express_1.default.Router();
// Public list (for booking form on /packages/[id])
router.get('/', eventType_controller_1.EventTypeController.list);
// Admin CRUD
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), eventType_controller_1.EventTypeController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), eventType_controller_1.EventTypeController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), eventType_controller_1.EventTypeController.remove);
exports.EventTypeRoutes = router;
