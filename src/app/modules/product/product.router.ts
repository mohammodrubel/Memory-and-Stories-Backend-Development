import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';

const router = express.Router();

router.post(
  '/create-product',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ProductValidation.createProductSchema),
  ProductController.createProduct,
);

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getSingleProduct);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(ProductValidation.updateProductSchema),
  ProductController.updateProduct,
);

router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), ProductController.deleteProduct);

export const ProductRoutes = router;
