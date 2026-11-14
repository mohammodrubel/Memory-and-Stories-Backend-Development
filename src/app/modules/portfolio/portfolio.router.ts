import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PortfolioController } from './portfolio.controller';
import { PortfolioValidation } from './portfolio.validation';

const router = express.Router();

router.post(
  '/create-portfolio',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PortfolioValidation.createPortfolioSchema),
  PortfolioController.createPortfolio,
);

router.get('/', PortfolioController.getAllPortfolios);
router.get('/:id', PortfolioController.getSinglePortfolio);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PortfolioValidation.updatePortfolioSchema),
  PortfolioController.updatePortfolio,
);

router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), PortfolioController.deletePortfolio);

export const PortfolioRoutes = router;
