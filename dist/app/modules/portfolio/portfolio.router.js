"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const portfolio_controller_1 = require("./portfolio.controller");
const portfolio_validation_1 = require("./portfolio.validation");
const router = express_1.default.Router();
router.post('/create-portfolio', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(portfolio_validation_1.PortfolioValidation.createPortfolioSchema), portfolio_controller_1.PortfolioController.createPortfolio);
router.get('/', portfolio_controller_1.PortfolioController.getAllPortfolios);
router.get('/:id', portfolio_controller_1.PortfolioController.getSinglePortfolio);
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(portfolio_validation_1.PortfolioValidation.updatePortfolioSchema), portfolio_controller_1.PortfolioController.updatePortfolio);
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), portfolio_controller_1.PortfolioController.deletePortfolio);
exports.PortfolioRoutes = router;
