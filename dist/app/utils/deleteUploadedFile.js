"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUploadedFileIfLocal = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOADS_DIR = path_1.default.join(process.cwd(), 'uploads');
/**
 * Best-effort cleanup for a URL previously returned by POST /upload/image.
 * Silently no-ops for anything that isn't one of our own local /uploads/
 * files (external URLs, Cloudinary video URLs, empty values) and never
 * throws — a stale file left on disk is far less harmful than a failed
 * delete/update because the filesystem hiccuped.
 */
const deleteUploadedFileIfLocal = (url) => {
    if (!url)
        return;
    try {
        const pathname = new URL(url).pathname;
        const marker = '/uploads/';
        const idx = pathname.indexOf(marker);
        if (idx === -1)
            return;
        const filename = decodeURIComponent(pathname.slice(idx + marker.length));
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return;
        }
        const filePath = path_1.default.join(UPLOADS_DIR, filename);
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
    }
    catch (_a) {
        // Not a local/valid URL, or the file was already gone — nothing to do.
    }
};
exports.deleteUploadedFileIfLocal = deleteUploadedFileIfLocal;
