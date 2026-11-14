import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentMethodController } from './paymentMethod.controller';
import { PaymentMethodValidation } from './paymentMethod.validation';

const router = express.Router();

// Public: active methods only (shown to customer at pay step)
router.get('/active', PaymentMethodController.listActive);

// Admin
router.get('/', auth(Role.ADMIN, Role.MANAGER), PaymentMethodController.listAll);
router.get('/:id', auth(Role.ADMIN, Role.MANAGER), PaymentMethodController.getOne);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PaymentMethodValidation.createSchema),
  PaymentMethodController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PaymentMethodValidation.updateSchema),
  PaymentMethodController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), PaymentMethodController.remove);

export const PaymentMethodRoutes = router;
