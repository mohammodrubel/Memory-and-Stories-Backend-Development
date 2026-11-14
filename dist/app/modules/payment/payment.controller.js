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
exports.PaymentController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const payment_service_1 = require("./payment.service");
const upload_middleware_1 = require("../upload/upload.middleware");
const createPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield payment_service_1.PaymentService.createBookingWithPayment(Object.assign(Object.assign({}, req.body), { userId }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Booking created, payment initiated',
        data: result,
    });
}));
const submitScreenshot = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!req.file)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Screenshot image required (field "image")');
    const screenshotPath = req.file.filename;
    const screenshotUrl = (0, upload_middleware_1.buildPublicUrl)(req, screenshotPath);
    const { transactionRef, paymentMethodId } = req.body;
    const result = yield payment_service_1.PaymentService.submitScreenshot(req.params.id, userId, screenshotPath, transactionRef, paymentMethodId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Screenshot submitted; awaiting admin approval',
        data: Object.assign(Object.assign({}, result), { screenshotUrl }),
    });
}));
const approve = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield payment_service_1.PaymentService.approvePayment(req.params.id, Object.assign(Object.assign({}, req.body), { adminId }));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: result.payment.status === 'PAID' ? 'Payment fully approved' : 'Partial payment approved',
        data: result,
    });
}));
const reject = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield payment_service_1.PaymentService.rejectPayment(req.params.id, req.body.adminNote, adminId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment rejected',
        data: result,
    });
}));
const listAll = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, status } = req.query;
    const result = yield payment_service_1.PaymentService.listAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status: status ? status : undefined,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payments retrieved',
        data: result.data,
        meta: result.meta,
    });
}));
const listMine = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield payment_service_1.PaymentService.listMine(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Your payments',
        data: result,
    });
}));
const getOne = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const result = yield payment_service_1.PaymentService.getOne(req.params.id, userId, (role === 'ADMIN' || role === 'MANAGER'));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment',
        data: result,
    });
}));
exports.PaymentController = {
    createPayment,
    submitScreenshot,
    approve,
    reject,
    listAll,
    listMine,
    getOne,
};
