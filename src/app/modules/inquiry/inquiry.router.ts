import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { InquiryController } from './inquiry.controller';
import { InquiryValidation } from './inquiry.validation';

const router = express.Router();

router.post('/', validateRequest(InquiryValidation.createInquirySchema), InquiryController.create);
router.get('/', auth(Role.ADMIN, Role.MANAGER), InquiryController.list);
router.patch(
  '/:id/status',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(InquiryValidation.updateStatusSchema),
  InquiryController.updateStatus,
);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), InquiryController.remove);

export const InquiryRoutes = router;
