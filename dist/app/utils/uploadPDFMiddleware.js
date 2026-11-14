"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.sendImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary.cloud_name,
    api_key: config_1.default.cloudinary.api_key,
    api_secret: config_1.default.cloudinary.api_secret,
});
const sendImageToCloudinary = (filePath, imageName) => {
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(filePath)) {
            return reject(new Error(`File not found at path: ${filePath}`));
        }
        try {
            fs_1.default.accessSync(filePath, fs_1.default.constants.R_OK);
        }
        catch (_a) {
            return reject(new Error(`File is not readable: ${filePath}`));
        }
        // 🧹 Sanitize imageName — remove extension, spaces & special chars
        const baseName = path_1.default.parse(imageName).name;
        const safeName = baseName
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/[^a-zA-Z0-9_-]/g, '') // Remove all invalid characters
            .toLowerCase();
        console.log('Uploading to Cloudinary:', { filePath, safeName });
        cloudinary_1.v2.uploader.upload(filePath, {
            public_id: safeName, // ✅ safe name only
            resource_type: 'raw',
            format: "pdf"
        }, (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            if (!result) {
                return reject(new Error('No response from Cloudinary'));
            }
            console.log(result);
            const secureUrl = result.secure_url;
            console.log('✅ Upload successful →', secureUrl);
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.warn('⚠️ Failed to delete local file:', err);
                resolve(secureUrl);
            });
        });
    });
};
exports.sendImageToCloudinary = sendImageToCloudinary;
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}
// Multer configuration
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = path_1.default.parse(file.originalname).name; // Get filename without extension
        const extension = path_1.default.extname(file.originalname); // Get file extension
        cb(null, originalName + '-' + uniqueSuffix + extension);
    },
});
// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed`));
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
