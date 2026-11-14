import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { OverviewController } from './overview.controller';

const router = express.Router();

router.get('/', auth(Role.ADMIN, Role.MANAGER), OverviewController.getOverview);

export const OverviewRoutes = router;
