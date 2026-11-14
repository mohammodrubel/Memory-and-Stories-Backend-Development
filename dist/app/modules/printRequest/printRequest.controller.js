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
exports.PrintRequestController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const printRequest_service_1 = require("./printRequest.service");
const init = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { bookingId } = req.body || {};
    if (!bookingId)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'bookingId required');
    const r = yield printRequest_service_1.PrintRequestService.getOrCreateDraft(userId, bookingId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Print request',
        data: r,
    });
}));
const listMine = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const r = yield printRequest_service_1.PrintRequestService.listForUser(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'My print requests',
        data: r,
    });
}));
const listAll = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield printRequest_service_1.PrintRequestService.listAll();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'All print requests',
        data: r,
    });
}));
const getOne = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const role = req.user.role;
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const r = yield printRequest_service_1.PrintRequestService.getOne(req.params.id, userId, isAdmin);
    if (!r)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Not found');
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Print request',
        data: r,
    });
}));
const updateSelections = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const r = yield printRequest_service_1.PrintRequestService.updateSelections(req.params.id, userId, req.body || {});
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Selections updated',
        data: r,
    });
}));
const submit = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { password } = req.body || {};
    if (!password)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'password required');
    const r = yield printRequest_service_1.PrintRequestService.submit(req.params.id, userId, password);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Print request submitted',
        data: r,
    });
}));
const adminAction = (action) => (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield printRequest_service_1.PrintRequestService.adminAction(req.params.id, action, req.body || {});
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: `Print request ${action}`,
        data: r,
    });
}));
exports.PrintRequestController = {
    init,
    listMine,
    listAll,
    getOne,
    updateSelections,
    submit,
    requestChanges: adminAction('request-changes'),
    approve: adminAction('approve'),
    startPrinting: adminAction('start-printing'),
    deliver: adminAction('deliver'),
    reject: adminAction('reject'),
};
