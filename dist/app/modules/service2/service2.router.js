"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const service2_validation_1 = __importDefault(require("./service2.validation"));
const service2_controller_1 = require("./service2.controller");
const router = express_1.default.Router();
// Public reads
router.get("/", service2_controller_1.ServiceController.getAllService);
router.get("/:id", service2_controller_1.ServiceController.getSingleService);
// Admin-only writes
router.post("/create-service", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(service2_validation_1.default), service2_controller_1.ServiceController.createNewService);
router.patch("/:id", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(service2_validation_1.default), service2_controller_1.ServiceController.updateService);
router.delete("/:id", (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), service2_controller_1.ServiceController.deleteService);
exports.ServiceRoutes = router;
