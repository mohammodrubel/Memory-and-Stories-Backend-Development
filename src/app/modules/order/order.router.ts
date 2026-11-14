import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = express.Router();

router.post(
  '/create-order',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  validateRequest(OrderValidation.createOrderSchema),
  OrderController.createOrder,
);

router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), OrderController.getMyOrders);
router.get('/', auth(Role.ADMIN, Role.MANAGER), OrderController.getAllOrders);
router.get('/:id', auth(Role.USER, Role.ADMIN, Role.MANAGER), OrderController.getSingleOrder);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(OrderValidation.updateOrderSchema),
  OrderController.updateOrder,
);

router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), OrderController.deleteOrder);

export const OrderRoutes = router;
