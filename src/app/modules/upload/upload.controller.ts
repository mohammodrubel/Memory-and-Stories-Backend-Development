import { Request, Response } from 'express';
import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { buildPublicUrl } from './upload.middleware';

const fileToPayload = (req: Request, file: Express.Multer.File) => ({
  url: buildPublicUrl(req, file.filename),
  filename: file.filename,
  originalName: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
});

const uploadSingle = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded. Use field name "image" or "file".');
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Upload successful',
    data: fileToPayload(req, req.file),
  });
});

const uploadMany = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No files uploaded.');
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Upload successful',
    data: files.map((f) => fileToPayload(req, f)),
  });
});

const deleteUpload = catchAsync(async (req: Request, res: Response) => {
  const rawFilename = req.params.filename;
  const filename = typeof rawFilename === 'string' ? rawFilename : '';
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid filename');
  }
  const filePath = path.join(process.cwd(), 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found');
  }
  fs.unlinkSync(filePath);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'File deleted',
    data: { filename },
  });
});

export const UploadController = { uploadSingle, uploadMany, deleteUpload };
