import z from 'zod';

const bookingEventSchema = z.object({
  packageDayId: z.string().nullable().optional(),
  eventTypeId: z.string().min(1, 'Event type required'),
  date: z.string().min(1, 'Date required'),
  venue: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'Service is required'),
    date: z.string().min(1, 'Date is required'),
    userId: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
    customerPhone: z.string().optional(),
    notes: z.string().optional(),
    events: z.array(bookingEventSchema).optional(),
    couponCode: z.string().optional(),
  }),
});

const updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
    date: z.string().optional(),
  }),
});

export const BookingValidation = {
  createBookingSchema,
  updateBookingSchema,
};
