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
exports.BannerController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const banner_service_1 = require("./banner.service");
const uploadVideoMiddleware_1 = require("../../utils/uploadVideoMiddleware");
// CREATE
const createNewBanner = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield banner_service_1.BannerService.createNewBanner(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "create banner successfully",
        data: result,
    });
}));
// GET ALL with search, filter, pagination
const getAllBanner = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const options = {
        searchTerm: search,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        sortBy: sortBy,
        sortOrder: sortOrder,
    };
    const result = yield banner_service_1.BannerService.getAllBanner(options);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "get all banner successfully",
        data: result.data,
        meta: result.meta,
    });
}));
// GET SINGLE
const getSingleBanner = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield banner_service_1.BannerService.getSingleBanner(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "get single banner successfully",
        data: result,
    });
}));
// UPDATE
const updateBanner = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield banner_service_1.BannerService.updateBanner(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "update banner successfully",
        data: result,
    });
}));
// DELETE
const deleteBanner = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield banner_service_1.BannerService.deleteBanner(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "delete banner successfully",
        data: result,
    });
}));
// UPLOAD VIDEO — returns Cloudinary secure_url
const uploadVideo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.BAD_REQUEST,
            message: "No video file uploaded",
            data: null,
        });
    }
    const url = yield (0, uploadVideoMiddleware_1.sendVideoToCloudinary)(req.file.path, req.file.originalname);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "video uploaded successfully",
        data: { url },
    });
}));
exports.BannerController = {
    createNewBanner,
    updateBanner,
    getAllBanner,
    getSingleBanner,
    deleteBanner,
    uploadVideo,
};
