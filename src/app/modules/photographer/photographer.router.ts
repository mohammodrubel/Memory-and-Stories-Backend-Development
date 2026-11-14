import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PhotographerController } from './photographer.controller';
import {
  PhotographerCreateSchema,
  PhotographerUpdateSchema,
} from './photographer.validation';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), PhotographerController.list);
router.get('/:id', auth(Role.ADMIN, Role.MANAGER), PhotographerController.get);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PhotographerCreateSchema),
  PhotographerController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(PhotographerUpdateSchema),
  PhotographerController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), PhotographerController.remove);

export const PhotographerRoutes = router;
