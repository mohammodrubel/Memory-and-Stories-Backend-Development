import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { DiscountController } from './discount.controller';
import { DiscountValidation } from './discount.validation';

const router = express.Router();

router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(DiscountValidation.createDiscountSchema),
  DiscountController.create,
);
router.get('/', auth(Role.ADMIN, Role.MANAGER), DiscountController.list);
router.post(
  '/validate-coupon',
  validateRequest(DiscountValidation.validateCouponSchema),
  DiscountController.validateCoupon,
);
router.get('/:id', auth(Role.ADMIN, Role.MANAGER), DiscountController.detail);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(DiscountValidation.updateDiscountSchema),
  DiscountController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), DiscountController.softDelete);

export const DiscountRoutes = router;
