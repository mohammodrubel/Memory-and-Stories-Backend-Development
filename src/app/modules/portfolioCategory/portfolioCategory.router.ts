import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PortfolioCategoryController } from './portfolioCategory.controller';
import { PortfolioCategoryValidation } from './portfolioCategory.validation';

const router = express.Router();

router.get('/', PortfolioCategoryController.list);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PortfolioCategoryValidation.createSchema),
  PortfolioCategoryController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PortfolioCategoryValidation.updateSchema),
  PortfolioCategoryController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), PortfolioCategoryController.remove);

export const PortfolioCategoryRoutes = router;
