import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { DeliveryController } from './delivery.controller';

const router = express.Router();

// SSE — token via ?token= because EventSource has no auth header support
router.get('/stream', DeliveryController.stream);

router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), DeliveryController.myDeliveries);
router.get(
  '/:bookingId',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  DeliveryController.getDelivery,
);
// download + thumbnail: token via ?token= (img/video tags can't send Bearer)
router.get(
  '/:bookingId/files/:fileId',
  DeliveryController.downloadFile,
);
router.get(
  '/:bookingId/files/:fileId/thumbnail',
  DeliveryController.thumbnail,
);

export const DeliveryRoutes = router;
