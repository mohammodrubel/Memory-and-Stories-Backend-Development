import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { PrintRequestController } from './printRequest.controller';

const router = express.Router();

// User
router.post('/init', auth(Role.USER, Role.ADMIN, Role.MANAGER), PrintRequestController.init);
router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), PrintRequestController.listMine);
router.patch(
  '/:id/selections',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  PrintRequestController.updateSelections,
);
router.post(
  '/:id/submit',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  PrintRequestController.submit,
);

// Admin
router.get('/', auth(Role.ADMIN, Role.MANAGER), PrintRequestController.listAll);
router.post(
  '/:id/request-changes',
  auth(Role.ADMIN, Role.MANAGER),
  PrintRequestController.requestChanges,
);
router.post(
  '/:id/approve',
  auth(Role.ADMIN, Role.MANAGER),
  PrintRequestController.approve,
);
router.post(
  '/:id/start-printing',
  auth(Role.ADMIN, Role.MANAGER),
  PrintRequestController.startPrinting,
);
router.post(
  '/:id/deliver',
  auth(Role.ADMIN, Role.MANAGER),
  PrintRequestController.deliver,
);
router.post(
  '/:id/reject',
  auth(Role.ADMIN, Role.MANAGER),
  PrintRequestController.reject,
);

// Shared (owner or admin) — must be last
router.get(
  '/:id',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  PrintRequestController.getOne,
);

export const PrintRequestRoutes = router;
