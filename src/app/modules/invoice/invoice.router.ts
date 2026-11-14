import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { InvoiceController } from './invoice.controller';

const router = express.Router();

router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), InvoiceController.getMyInvoices);
router.get('/', auth(Role.ADMIN, Role.MANAGER), InvoiceController.getInvoices);

export const InvoiceRoutes = router;
