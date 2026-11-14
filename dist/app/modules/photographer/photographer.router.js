"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotographerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const photographer_controller_1 = require("./photographer.controller");
const photographer_validation_1 = require("./photographer.validation");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), photographer_controller_1.PhotographerController.list);
router.get('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), photographer_controller_1.PhotographerController.get);
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(photographer_validation_1.PhotographerCreateSchema), photographer_controller_1.PhotographerController.create);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(photographer_validation_1.PhotographerUpdateSchema), photographer_controller_1.PhotographerController.update);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), photographer_controller_1.PhotographerController.remove);
exports.PhotographerRoutes = router;
