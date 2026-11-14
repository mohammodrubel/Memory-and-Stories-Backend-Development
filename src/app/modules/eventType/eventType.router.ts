import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import { EventTypeController } from './eventType.controller';

const router = express.Router();

// Public list (for booking form on /packages/[id])
router.get('/', EventTypeController.list);

// Admin CRUD
router.post('/', auth(Role.ADMIN, Role.MANAGER), EventTypeController.create);
router.patch('/:id', auth(Role.ADMIN, Role.MANAGER), EventTypeController.update);
router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), EventTypeController.remove);

export const EventTypeRoutes = router;
