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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const inquiry_service_1 = require("./inquiry.service");
const create = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { website: _hp } = _a, body = __rest(_a, ["website"]);
    const data = yield inquiry_service_1.InquiryService.createInquiry(body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Inquiry received', data });
}));
const list = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, status } = req.query;
    const r = yield inquiry_service_1.InquiryService.getAllInquiries({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status: status,
    });
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Inquiries retrieved', data: r.data, meta: r.meta });
}));
const updateStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield inquiry_service_1.InquiryService.updateStatus(req.params.id, req.body.status);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Inquiry updated', data });
}));
const remove = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield inquiry_service_1.InquiryService.deleteInquiry(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Inquiry deleted', data });
}));
exports.InquiryController = { create, list, updateStatus, remove };
