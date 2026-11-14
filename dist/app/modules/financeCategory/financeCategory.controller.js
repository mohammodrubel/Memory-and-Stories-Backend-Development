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
exports.FinanceCategoryController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const financeCategory_service_1 = require("./financeCategory.service");
const list = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const type = req.query.type;
    const includeArchived = req.query.includeArchived === 'true';
    const data = yield financeCategory_service_1.FinanceCategoryService.list(type === 'EXPENSE' || type === 'INCOME' ? type : undefined, includeArchived);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Categories fetched', data });
}));
const create = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield financeCategory_service_1.FinanceCategoryService.create(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Category created', data });
}));
const update = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield financeCategory_service_1.FinanceCategoryService.update(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Category updated', data });
}));
const remove = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield financeCategory_service_1.FinanceCategoryService.remove(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Category deleted', data });
}));
exports.FinanceCategoryController = { list, create, update, remove };
