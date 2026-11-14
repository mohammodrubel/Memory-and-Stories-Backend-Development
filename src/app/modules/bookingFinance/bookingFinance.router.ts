import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookingFinanceController } from './bookingFinance.controller';
import {
  AssignmentCreateSchema,
  AssignmentUpdateSchema,
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
} from './bookingFinance.validation';

const router = express.Router({ mergeParams: true });

// Assignments
router.get(
  '/:bookingId/assignments',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  BookingFinanceController.listAssignments,
);
router.post(
  '/:bookingId/assignments',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(AssignmentCreateSchema),
  BookingFinanceController.createAssignment,
);
router.patch(
  '/:bookingId/assignments/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(AssignmentUpdateSchema),
  BookingFinanceController.updateAssignment,
);
router.delete(
  '/:bookingId/assignments/:id',
  auth(Role.ADMIN, Role.MANAGER),
  BookingFinanceController.deleteAssignment,
);

// Expenses
router.get('/:bookingId/expenses', auth(Role.ADMIN, Role.MANAGER), BookingFinanceController.listExpenses);
router.post(
  '/:bookingId/expenses',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ExpenseCreateSchema),
  BookingFinanceController.createExpense,
);
router.patch(
  '/:bookingId/expenses/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ExpenseUpdateSchema),
  BookingFinanceController.updateExpense,
);
router.delete(
  '/:bookingId/expenses/:id',
  auth(Role.ADMIN, Role.MANAGER),
  BookingFinanceController.deleteExpense,
);

// Profit
router.get('/:bookingId/profit', auth(Role.ADMIN, Role.MANAGER), BookingFinanceController.profit);

export const BookingFinanceRoutes = router;
