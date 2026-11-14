import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import httpStatus from 'http-status';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { imageUpload } from '../upload/upload.middleware';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';
import { PaymentInvoiceService } from './paymentInvoice.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const router = express.Router();

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

// User creates booking + payment (initiates)
router.post(
  '/initiate',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  validateRequest(PaymentValidation.createSchema),
  PaymentController.createPayment,
);

// User uploads screenshot for a specific payment
router.post(
  '/:id/screenshot',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  handleMulter(imageUpload.single('image')),
  validateRequest(PaymentValidation.submitScreenshotSchema),
  PaymentController.submitScreenshot,
);

// User: list own payments
router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), PaymentController.listMine);

// Admin: list all
router.get('/', auth(Role.ADMIN, Role.MANAGER), PaymentController.listAll);

// Owner or admin: single payment
router.get('/:id', auth(Role.USER, Role.ADMIN, Role.MANAGER), PaymentController.getOne);

// Admin approve (with optional partial paidAmount)
router.patch(
  '/:id/approve',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PaymentValidation.approveSchema),
  PaymentController.approve,
);

// Admin reject
router.patch(
  '/:id/reject',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PaymentValidation.rejectSchema),
  PaymentController.reject,
);

// Payment-invoices (persistent invoices generated on approval)
router.get(
  '/invoice/me',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const userId = (req.user as any)?.id;
    const data = await PaymentInvoiceService.listMine(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Your invoices',
      data,
    });
  }),
);

router.get(
  '/invoice/all',
  auth(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const { page, limit, userId } = req.query;
    const result = await PaymentInvoiceService.listAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      userId: userId as string,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'All invoices',
      data: result.data,
      meta: result.meta,
    });
  }),
);

router.get(
  '/invoice/:id',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const userId = (req.user as any)?.id;
    const role = (req.user as any)?.role;
    const data = await PaymentInvoiceService.getOne(
      req.params.id as string,
      userId,
      (role === 'ADMIN' || role === 'MANAGER'),
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Invoice',
      data,
    });
  }),
);

router.get(
  '/invoice/:id/pdf',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const userId = (req.user as any)?.id;
    const role = (req.user as any)?.role;
    const id = req.params.id as string;
    const inv = await PaymentInvoiceService.getOne(id, userId, (role === 'ADMIN' || role === 'MANAGER'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${inv.invoiceNo}.pdf"`,
    );
    await PaymentInvoiceService.streamPdf(id, userId, (role === 'ADMIN' || role === 'MANAGER'), res);
  }),
);

export const PaymentRoutes = router;
