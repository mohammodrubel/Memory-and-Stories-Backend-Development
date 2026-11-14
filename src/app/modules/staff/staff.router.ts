import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { StaffController } from './staff.controller';
import { StaffCreateSchema, StaffUpdateSchema } from './staff.validation';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), StaffController.list);
router.get('/:id', auth(Role.ADMIN, Role.MANAGER), StaffController.get);
router.post(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(StaffCreateSchema),
  StaffController.create,
);
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(StaffUpdateSchema),
  StaffController.update,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), StaffController.remove);

export const StaffRoutes = router;
