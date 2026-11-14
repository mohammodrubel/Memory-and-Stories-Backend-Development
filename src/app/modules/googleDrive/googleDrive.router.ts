import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { GoogleDriveController } from './googleDrive.controller';

const router = express.Router();

router.get('/connect', auth(Role.ADMIN, Role.MANAGER), GoogleDriveController.connect);
router.get('/callback', GoogleDriveController.callback);
router.get('/status', auth(Role.ADMIN, Role.MANAGER), GoogleDriveController.status);
router.delete('/disconnect', auth(Role.ADMIN, Role.MANAGER), GoogleDriveController.disconnect);
router.get('/picker-token', auth(Role.ADMIN, Role.MANAGER), GoogleDriveController.pickerToken);

export const GoogleDriveRoutes = router;
