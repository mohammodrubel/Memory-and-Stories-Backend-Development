import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RecurringExpenseController } from './recurringExpense.controller';
import { RecurringCreateSchema, RecurringUpdateSchema } from './recurringExpense.validation';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), RecurringExpenseController.list);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(RecurringCreateSchema),
  RecurringExpenseController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(RecurringUpdateSchema),
  RecurringExpenseController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), RecurringExpenseController.remove);

export const RecurringExpenseRoutes = router;
