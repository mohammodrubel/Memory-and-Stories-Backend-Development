import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import SiteSettingsSchema from './siteSettings.validation';
import { SiteSettingsController } from './siteSettings.controller';

const router = express.Router();

router.get('/', SiteSettingsController.get);
router.put(
  '/',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(SiteSettingsSchema),
  SiteSettingsController.update,
);

export const SiteSettingsRoutes = router;
