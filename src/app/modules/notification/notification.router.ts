import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { NotificationController } from './notification.controller';

const router = express.Router();

router.get('/', auth(Role.USER, Role.ADMIN, Role.MANAGER), NotificationController.list);
router.patch(
  '/read-all',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  NotificationController.readAll,
);
router.patch(
  '/:id/read',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  NotificationController.read,
);

export const NotificationRoutes = router;
