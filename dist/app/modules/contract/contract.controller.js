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
exports.ContractController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const contract_service_1 = require("./contract.service");
const getTemplate = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield contract_service_1.ContractService.getTemplate();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Contract template',
        data,
    });
}));
const updateTemplate = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, intro, clauses } = req.body || {};
    if (!Array.isArray(clauses)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'clauses must be an array');
    }
    const data = yield contract_service_1.ContractService.updateTemplate({
        title,
        intro,
        clauses,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Contract template updated',
        data,
    });
}));
const getBookingContract = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const bookingId = req.params.bookingId;
    const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    if (!isAdmin && booking.userId !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your booking');
    }
    const contract = yield contract_service_1.ContractService.getBookingContract(bookingId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Contract',
        data: contract,
    });
}));
const signBookingContract = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const bookingId = req.params.bookingId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { signatoryName, signatureDataUrl } = req.body || {};
    const booking = yield prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Booking not found');
    if (booking.userId !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your booking');
    }
    const ip = ((_c = (_b = req.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.split(',')[0]) === null || _c === void 0 ? void 0 : _c.trim()) ||
        req.socket.remoteAddress ||
        undefined;
    const data = yield contract_service_1.ContractService.signBookingContract({
        bookingId,
        signatoryName,
        signatureDataUrl,
        signedIp: ip,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Contract signed',
        data,
    });
}));
exports.ContractController = {
    getTemplate,
    updateTemplate,
    getBookingContract,
    signBookingContract,
};
