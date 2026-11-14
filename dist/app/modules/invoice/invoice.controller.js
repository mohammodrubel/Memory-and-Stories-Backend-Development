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
exports.InvoiceController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const invoice_service_1 = require("./invoice.service");
const getInvoices = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page, limit, userId, source } = req.query;
    const result = yield invoice_service_1.InvoiceService.getInvoices({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userId: userId,
        source: (_a = source) !== null && _a !== void 0 ? _a : 'ALL',
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Invoices retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getMyInvoices = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { page, limit } = req.query;
    const result = yield invoice_service_1.InvoiceService.getInvoices({
        userId,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Your invoices retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
exports.InvoiceController = {
    getInvoices,
    getMyInvoices,
};
