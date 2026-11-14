import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { FinanceCategoryController } from './financeCategory.controller';
import { CategoryCreateSchema, CategoryUpdateSchema } from './financeCategory.validation';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), FinanceCategoryController.list);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(CategoryCreateSchema),
  FinanceCategoryController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(CategoryUpdateSchema),
  FinanceCategoryController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), FinanceCategoryController.remove);

export const FinanceCategoryRoutes = router;
