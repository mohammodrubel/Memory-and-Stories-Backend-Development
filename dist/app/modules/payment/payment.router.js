"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const upload_middleware_1 = require("../upload/upload.middleware");
const payment_controller_1 = require("./payment.controller");
const payment_validation_1 = require("./payment.validation");
const paymentInvoice_service_1 = require("./paymentInvoice.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const router = express_1.default.Router();
const handleMulter = (mw) => (req, res, next) => {
    mw(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: err.message,
                error: [{ message: err.message, path: err.field || '' }],
            });
            return;
        }
        if (err instanceof Error) {
            res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: err.message,
                error: [{ message: err.message, path: '' }],
            });
            return;
        }
        next();
    });
};
// User creates booking + payment (initiates)
router.post('/initiate', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(payment_validation_1.PaymentValidation.createSchema), payment_controller_1.PaymentController.createPayment);
// User uploads screenshot for a specific payment
router.post('/:id/screenshot', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), handleMulter(upload_middleware_1.imageUpload.single('image')), (0, validateRequest_1.default)(payment_validation_1.PaymentValidation.submitScreenshotSchema), payment_controller_1.PaymentController.submitScreenshot);
// User: list own payments
router.get('/me', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), payment_controller_1.PaymentController.listMine);
// Admin: list all
router.get('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), payment_controller_1.PaymentController.listAll);
// Owner or admin: single payment
router.get('/:id', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), payment_controller_1.PaymentController.getOne);
// Admin approve (with optional partial paidAmount)
router.patch('/:id/approve', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(payment_validation_1.PaymentValidation.approveSchema), payment_controller_1.PaymentController.approve);
// Admin reject
router.patch('/:id/reject', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validateRequest_1.default)(payment_validation_1.PaymentValidation.rejectSchema), payment_controller_1.PaymentController.reject);
// Payment-invoices (persistent invoices generated on approval)
router.get('/invoice/me', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const data = yield paymentInvoice_service_1.PaymentInvoiceService.listMine(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Your invoices',
        data,
    });
})));
router.get('/invoice/all', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, userId } = req.query;
    const result = yield paymentInvoice_service_1.PaymentInvoiceService.listAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userId: userId,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'All invoices',
        data: result.data,
        meta: result.meta,
    });
})));
router.get('/invoice/:id', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const data = yield paymentInvoice_service_1.PaymentInvoiceService.getOne(req.params.id, userId, (role === 'ADMIN' || role === 'MANAGER'));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Invoice',
        data,
    });
})));
router.get('/invoice/:id/pdf', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const id = req.params.id;
    const inv = yield paymentInvoice_service_1.PaymentInvoiceService.getOne(id, userId, (role === 'ADMIN' || role === 'MANAGER'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.invoiceNo}.pdf"`);
    yield paymentInvoice_service_1.PaymentInvoiceService.streamPdf(id, userId, (role === 'ADMIN' || role === 'MANAGER'), res);
})));
exports.PaymentRoutes = router;
