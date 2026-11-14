"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const upload_middleware_1 = require("./upload.middleware");
const upload_controller_1 = require("./upload.controller");
const router = express_1.default.Router();
// Wrap multer middleware so MulterError / fileFilter errors become 400 JSON responses,
// not generic 500s from the global handler.
const handleMulter = (mw) => (req, res, next) => {
    mw(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: err.message,
                error: [{ message: err.message, path: err.field || '' }],
            });
            return;
        }
        if (err instanceof Error) {
            res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: err.message,
                error: [{ message: err.message, path: '' }],
            });
            return;
        }
        next();
    });
};
// Any authed user can upload (used by booking screenshot flow + admin asset uploads)
router.post('/image', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), handleMulter(upload_middleware_1.imageUpload.single('image')), upload_controller_1.UploadController.uploadSingle);
router.post('/images', (0, auth_1.default)(client_1.Role.USER, client_1.Role.ADMIN, client_1.Role.MANAGER), handleMulter(upload_middleware_1.imageUpload.array('images', 10)), upload_controller_1.UploadController.uploadMany);
// Only admin can delete arbitrary uploads (path-based deletion is privileged)
router.delete('/:filename', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.MANAGER), upload_controller_1.UploadController.deleteUpload);
exports.UploadRoutes = router;
