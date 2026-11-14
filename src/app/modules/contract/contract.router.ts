import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { ContractController } from './contract.controller';

const router = express.Router();

// Template
router.get('/template', ContractController.getTemplate);
router.put(
  '/template',
  auth(Role.ADMIN, Role.MANAGER),
  ContractController.updateTemplate,
);

// Per-booking
router.get(
  '/booking/:bookingId',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  ContractController.getBookingContract,
);
router.post(
  '/booking/:bookingId/sign',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  ContractController.signBookingContract,
);

export const ContractRoutes = router;
