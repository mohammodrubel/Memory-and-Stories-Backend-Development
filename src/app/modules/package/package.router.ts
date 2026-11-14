import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { PackageController } from './package.controller';

const router = express.Router();

// Public reads (storefront browse)
router.get('/', PackageController.getAllServices);
router.get('/:id', PackageController.getSingleService);

// Admin-only writes
router.post('/create-package', auth(Role.ADMIN, Role.MANAGER), PackageController.createService);
router.patch('/:id', auth(Role.ADMIN, Role.MANAGER), PackageController.updateService);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), PackageController.deleteService);

export const Packagerouter = router;
