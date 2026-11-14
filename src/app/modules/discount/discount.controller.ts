import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import config from '../../config';
import prisma from '../../utils/prisma';
import { DiscountService } from './discount.service';

const resolveOptionalUser = async (req: Request): Promise<string | null> => {
  try {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) return null;
    const token = bearer.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, config.jwt_access_token_secret as string) as JwtPayload;
    if (!decoded?.email) return null;
    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    return user?.id ?? null;
  } catch {
    return null;
  }
};

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.createDiscount(req.body, (req as any).user.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Discount created', data: result });
});

const list = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    kind: req.query.kind as any,
    active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    page: req.query.page ? Number(req.query.page as string) : 1,
    limit: req.query.limit ? Number(req.query.limit as string) : 20,
  };
  const result = await DiscountService.listDiscounts(filters);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'OK', data: result });
});

const detail = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.getDiscount(req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'OK', data: result });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.updateDiscount(req.params.id as string, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Updated', data: result });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.softDeleteDiscount(req.params.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Archived', data: result });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id ?? (await resolveOptionalUser(req));
  const result = await DiscountService.validateCoupon({ ...req.body, userId });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'OK', data: result });
});

export const DiscountController = { create, list, detail, update, softDelete, validateCoupon };
