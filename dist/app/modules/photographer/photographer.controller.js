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
exports.PhotographerController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const photographer_service_1 = require("./photographer.service");
const list = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const includeArchived = req.query.archived === 'true';
    const data = yield photographer_service_1.PhotographerService.list(includeArchived);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Photographers fetched', data });
}));
const get = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield photographer_service_1.PhotographerService.getById(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Photographer fetched', data });
}));
const create = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield photographer_service_1.PhotographerService.create(req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.CREATED, message: 'Photographer created', data });
}));
const update = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield photographer_service_1.PhotographerService.update(req.params.id, req.body);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Photographer updated', data });
}));
const remove = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield photographer_service_1.PhotographerService.remove(req.params.id);
    (0, sendResponse_1.default)(res, { success: true, statusCode: http_status_1.default.OK, message: 'Photographer deleted', data });
}));
exports.PhotographerController = { list, get, create, update, remove };
