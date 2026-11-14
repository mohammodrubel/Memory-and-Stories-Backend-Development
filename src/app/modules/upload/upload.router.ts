import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import httpStatus from 'http-status';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { imageUpload } from './upload.middleware';
import { UploadController } from './upload.controller';

const router = express.Router();

// Wrap multer middleware so MulterError / fileFilter errors become 400 JSON responses,
// not generic 500s from the global handler.
const handleMulter = (mw: express.RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  mw(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message,
        error: [{ message: err.message, path: err.field || '' }],
      });
      return;
    }
    if (err instanceof Error) {
      res.status(httpStatus.BAD_REQUEST).json({
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
router.post(
  '/image',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  handleMulter(imageUpload.single('image')),
  UploadController.uploadSingle,
);
router.post(
  '/images',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  handleMulter(imageUpload.array('images', 10)),
  UploadController.uploadMany,
);
// Only admin can delete arbitrary uploads (path-based deletion is privileged)
router.delete('/:filename', auth(Role.ADMIN, Role.MANAGER), UploadController.deleteUpload);

export const UploadRoutes = router;
