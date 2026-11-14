import { Router } from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', auth(Role.ADMIN), UserController.GetAllUsers);
router.get('/export', auth(Role.ADMIN), UserController.ExportUsers);
router.get('/profile', auth(), UserController.GetProfile);
router.patch('/profile', auth(), UserController.UpdateProfile);
router.patch('/:id/role', auth(Role.ADMIN), UserController.SetUserRole);
router
  .route('/:id')
  .get(auth(Role.ADMIN), UserController.GetSingleUser)
  .delete(auth(Role.ADMIN), UserController.DeleteUser);

export const userRouter = router;
