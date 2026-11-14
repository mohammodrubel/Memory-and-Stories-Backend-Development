import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ExpenseController } from './expense.controller';
import {
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
  IncomeCreateSchema,
  IncomeUpdateSchema,
  ConfirmDraftsSchema,
} from './expense.validation';

const router = express.Router();

// Expenses
router.get('/expenses', auth(Role.ADMIN, Role.MANAGER), ExpenseController.listExpenses);
router.post(
  '/expenses',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ExpenseCreateSchema),
  ExpenseController.createExpense,
);
router.patch(
  '/expenses/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ExpenseUpdateSchema),
  ExpenseController.updateExpense,
);
router.delete('/expenses/:id', auth(Role.ADMIN, Role.MANAGER), ExpenseController.deleteExpense);

// Incomes
router.get('/incomes', auth(Role.ADMIN, Role.MANAGER), ExpenseController.listIncomes);
router.post(
  '/incomes',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(IncomeCreateSchema),
  ExpenseController.createIncome,
);
router.patch(
  '/incomes/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(IncomeUpdateSchema),
  ExpenseController.updateIncome,
);
router.delete('/incomes/:id', auth(Role.ADMIN, Role.MANAGER), ExpenseController.deleteIncome);

// Dashboard
router.get('/summary', auth(Role.ADMIN, Role.MANAGER), ExpenseController.summary);
router.get('/timeseries', auth(Role.ADMIN, Role.MANAGER), ExpenseController.timeseries);
router.get('/drafts', auth(Role.ADMIN, Role.MANAGER), ExpenseController.getDrafts);
router.post(
  '/drafts/confirm',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ConfirmDraftsSchema),
  ExpenseController.confirmDrafts,
);

export const ExpenseRoutes = router;
