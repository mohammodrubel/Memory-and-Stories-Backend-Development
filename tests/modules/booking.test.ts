import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { BookingRoutes } from '../../src/app/modules/booking/booking.router';
import { BookingService } from '../../src/app/modules/booking/booking.service';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(BookingRoutes, '/api/booking');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 'tester@example.com',
    name: 'Tester',
    role: 'ADMIN',
  });
});

describe('BookingService', () => {
  it('createBooking converts date string to a Date object', async () => {
    (prisma.service.findUnique as any).mockResolvedValue({ id: 's1', amount: 1000 });
    (prisma.discount.findMany as any).mockResolvedValue([]);
    (prisma.booking.create as any).mockResolvedValue({ id: 'b1' });
    await BookingService.createBooking({
      userId: 'u1',
      serviceId: 's1',
      date: '2026-06-01',
    });
    const args = (prisma.booking.create as any).mock.calls[0][0];
    expect(args.data.date).toBeInstanceOf(Date);
    expect(args.data.userId).toBe('u1');
  });

  it('getAllBookings filters by status when provided', async () => {
    (prisma.booking.findMany as any).mockResolvedValue([]);
    (prisma.booking.count as any).mockResolvedValue(0);
    await BookingService.getAllBookings({ status: 'CONFIRMED' });
    const where = (prisma.booking.findMany as any).mock.calls[0][0].where;
    expect(where.status).toBe('CONFIRMED');
  });

  it('updateBooking only updates status when only status is provided', async () => {
    (prisma.booking.update as any).mockResolvedValue({ id: 'b1' });
    await BookingService.updateBooking('b1', { status: 'CANCELLED' });
    const args = (prisma.booking.update as any).mock.calls[0][0];
    expect(args.data.status).toBe('CANCELLED');
    expect(args.data.date).toBeUndefined();
  });
});

describe('Booking routes', () => {
  it('GET / returns paginated bookings', async () => {
    (prisma.booking.findMany as any).mockResolvedValue([
      { id: 'b1', user: { name: 'John' }, service: { title: 'Wedding' } },
    ]);
    (prisma.booking.count as any).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/booking?page=1&limit=10')
      .set(authHeader({ role: 'ADMIN' }));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('PATCH /:id updates the status of a booking', async () => {
    (prisma.booking.update as any).mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
    });
    const res = await request(app)
      .patch('/api/booking/b1')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('PATCH /:id rejects an invalid status value', async () => {
    const res = await request(app)
      .patch('/api/booking/b1')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ status: 'BOGUS' });
    expect(res.status).toBe(400);
  });
});
