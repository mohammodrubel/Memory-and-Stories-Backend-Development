import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Best-effort cleanup for a URL previously returned by POST /upload/image.
 * Silently no-ops for anything that isn't one of our own local /uploads/
 * files (external URLs, Cloudinary video URLs, empty values) and never
 * throws — a stale file left on disk is far less harmful than a failed
 * delete/update because the filesystem hiccuped.
 */
export const deleteUploadedFileIfLocal = (url?: string | null) => {
  if (!url) return;
  try {
    const pathname = new URL(url).pathname;
    const marker = '/uploads/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return;

    const filename = decodeURIComponent(pathname.slice(idx + marker.length));
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return;
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Not a local/valid URL, or the file was already gone — nothing to do.
  }
};
