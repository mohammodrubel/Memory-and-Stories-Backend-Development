"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicUrl = exports.imageUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const base = path_1.default
            .parse(file.originalname)
            .name.replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .toLowerCase()
            .slice(0, 40);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${base || 'file'}-${suffix}${ext}`);
    },
});
const ALLOWED_IMAGE_MIME = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
];
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const imageFilter = (_req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`));
    }
    if (!ALLOWED_IMAGE_EXT.includes(ext)) {
        return cb(new Error(`Invalid file extension "${ext}". Allowed: ${ALLOWED_IMAGE_EXT.join(', ')}`));
    }
    cb(null, true);
};
exports.imageUpload = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
const buildPublicUrl = (req, filename) => {
    const host = req.get('host');
    return `${req.protocol}://${host}/uploads/${filename}`;
};
exports.buildPublicUrl = buildPublicUrl;
