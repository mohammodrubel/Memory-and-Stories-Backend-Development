import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const base = path
      .parse(file.originalname)
      .name.replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase()
      .slice(0, 40);
    const ext = path.extname(file.originalname).toLowerCase();
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

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`));
  }
  if (!ALLOWED_IMAGE_EXT.includes(ext)) {
    return cb(new Error(`Invalid file extension "${ext}". Allowed: ${ALLOWED_IMAGE_EXT.join(', ')}`));
  }
  cb(null, true);
};

export const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const buildPublicUrl = (req: { protocol: string; get: (h: string) => string | undefined }, filename: string) => {
  const host = req.get('host');
  return `${req.protocol}://${host}/uploads/${filename}`;
};
