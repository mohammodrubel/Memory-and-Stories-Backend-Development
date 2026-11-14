import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = express.Router();

router.post(
  '/create-category',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(CategoryValidation.createCategorySchema),
  CategoryController.createCategory,
);

router.get('/', auth(), CategoryController.getAllCategories);

router.get('/:id', auth(), CategoryController.getSingleCategory);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(CategoryValidation.updateCategorySchema),
  CategoryController.updateCategory,
);

router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), CategoryController.deleteCategory);

export const CategoryRoutes = router;
