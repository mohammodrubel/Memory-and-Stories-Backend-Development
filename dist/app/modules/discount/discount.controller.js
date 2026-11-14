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
exports.DiscountController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const discount_service_1 = require("./discount.service");
const resolveOptionalUser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bearer = req.headers.authorization;
        if (!bearer || !bearer.startsWith('Bearer '))
            return null;
        const token = bearer.split(' ')[1];
        if (!token)
            return null;
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_token_secret);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.email))
            return null;
        const user = yield prisma_1.default.user.findUnique({ where: { email: decoded.email } });
        return (_a = user === null || user === void 0 ? void 0 : user.id) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        return null;
    }
});
const create = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountService.createDiscount(req.body, req.user.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Discount created', data: result });
}));
const list = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = {
        kind: req.query.kind,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
    };
    const result = yield discount_service_1.DiscountService.listDiscounts(filters);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'OK', data: result });
}));
const detail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountService.getDiscount(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'OK', data: result });
}));
const update = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountService.updateDiscount(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Updated', data: result });
}));
const softDelete = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield discount_service_1.DiscountService.softDeleteDiscount(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Archived', data: result });
}));
const validateCoupon = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (yield resolveOptionalUser(req));
    const result = yield discount_service_1.DiscountService.validateCoupon(Object.assign(Object.assign({}, req.body), { userId }));
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'OK', data: result });
}));
exports.DiscountController = { create, list, detail, update, softDelete, validateCoupon };
