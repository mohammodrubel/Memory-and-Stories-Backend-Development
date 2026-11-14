"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintRequestRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const printRequest_controller_1 = require("./printRequest.controller");
const router = express_1.default.Router();
// User
router.post('/init', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.init);
router.get('/me', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.listMine);
router.patch('/:id/selections', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.updateSelections);
router.post('/:id/submit', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.submit);
// Admin
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.listAll);
router.post('/:id/request-changes', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.requestChanges);
router.post('/:id/approve', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.approve);
router.post('/:id/start-printing', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.startPrinting);
router.post('/:id/deliver', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.deliver);
router.post('/:id/reject', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.reject);
// Shared (owner or admin) — must be last
router.get('/:id', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), printRequest_controller_1.PrintRequestController.getOne);
exports.PrintRequestRoutes = router;
