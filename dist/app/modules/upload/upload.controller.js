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
exports.UploadController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const upload_middleware_1 = require("./upload.middleware");
const fileToPayload = (req, file) => ({
    url: (0, upload_middleware_1.buildPublicUrl)(req, file.filename),
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
});
const uploadSingle = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No file uploaded. Use field name "image" or "file".');
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Upload successful',
        data: fileToPayload(req, req.file),
    });
}));
const uploadMany = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files || [];
    if (files.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No files uploaded.');
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Upload successful',
        data: files.map((f) => fileToPayload(req, f)),
    });
}));
const deleteUpload = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rawFilename = req.params.filename;
    const filename = typeof rawFilename === 'string' ? rawFilename : '';
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid filename');
    }
    const filePath = path_1.default.join(process.cwd(), 'uploads', filename);
    if (!fs_1.default.existsSync(filePath)) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'File not found');
    }
    fs_1.default.unlinkSync(filePath);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'File deleted',
        data: { filename },
    });
}));
exports.UploadController = { uploadSingle, uploadMany, deleteUpload };
