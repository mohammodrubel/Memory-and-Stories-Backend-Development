"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUpload = exports.sendVideoToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary.cloud_name,
    api_key: config_1.default.cloudinary.api_key,
    api_secret: config_1.default.cloudinary.api_secret,
});
const sendVideoToCloudinary = (filePath, videoName) => {
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(filePath)) {
            return reject(new Error(`File not found at path: ${filePath}`));
        }
        const baseName = path_1.default.parse(videoName).name;
        const safeName = baseName
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .toLowerCase();
        cloudinary_1.v2.uploader.upload(filePath, {
            public_id: safeName,
            resource_type: "video",
            folder: "banner_videos",
        }, (error, result) => {
            if (error) {
                return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            if (!result) {
                return reject(new Error("No response from Cloudinary"));
            }
            const secureUrl = result.secure_url;
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.warn("Failed to delete local file:", err);
                resolve(secureUrl);
            });
        });
    });
};
exports.sendVideoToCloudinary = sendVideoToCloudinary;
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const originalName = path_1.default.parse(file.originalname).name;
        const extension = path_1.default.extname(file.originalname);
        cb(null, originalName + "-" + uniqueSuffix + extension);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-matroska",
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Allowed: ${allowed.join(", ")}`));
    }
};
exports.videoUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (Cloudinary free plan cap)
});
