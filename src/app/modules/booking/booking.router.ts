import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookingController } from './booking.controller';
import { BookingValidation } from './booking.validation';
import { DiscountValidation } from '../discount/discount.validation';

const router = express.Router();

router.post(
  '/create-booking',
  auth(Role.USER, Role.ADMIN, Role.MANAGER),
  validateRequest(BookingValidation.createBookingSchema),
  BookingController.createBooking,
);

router.get('/me', auth(Role.USER, Role.ADMIN, Role.MANAGER), BookingController.getMyBookings);

router.get('/', auth(Role.ADMIN, Role.MANAGER), BookingController.getAllBookings);
router.get('/:id', auth(Role.USER, Role.ADMIN, Role.MANAGER), BookingController.getSingleBooking);

router.patch(
  '/:id',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(BookingValidation.updateBookingSchema),
  BookingController.updateBooking,
);

router.post('/:id/deliver', auth(Role.ADMIN, Role.MANAGER), BookingController.deliverBooking);
router.post(
  '/:id/refresh-snapshot',
  auth(Role.ADMIN, Role.MANAGER),
  BookingController.refreshSnapshot,
);
router.patch(
  '/:id/print-limit',
  auth(Role.ADMIN, Role.MANAGER),
  BookingController.setPrintLimit,
);

router.delete('/:id', auth(Role.ADMIN, Role.MANAGER), BookingController.deleteBooking);

router.post(
  '/:id/discounts',
  auth(Role.ADMIN, Role.MANAGER),
  validateRequest(DiscountValidation.adHocDiscountSchema),
  BookingController.applyAdHocDiscount,
);
router.delete(
  '/:id/discounts',
  auth(Role.ADMIN, Role.MANAGER),
  BookingController.removeBookingDiscount,
);

export const BookingRoutes = router;
