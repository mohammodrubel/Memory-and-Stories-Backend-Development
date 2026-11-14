import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { CalendarController } from './calendar.controller';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), CalendarController.listRange);
router.post(
  '/booking/:id/push',
  auth(Role.ADMIN, Role.MANAGER),
  CalendarController.push,
);
router.delete(
  '/booking/:id/push',
  auth(Role.ADMIN, Role.MANAGER),
  CalendarController.remove,
);

export const CalendarRoutes = router;
