import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { PaymentRoutes } from '../../src/app/modules/payment/payment.router';
import { BookingRoutes } from '../../src/app/modules/booking/booking.router';
import { buildTestApp, authHeader } from '../helpers/app';

const paymentApp = buildTestApp(PaymentRoutes, '/api/payment');
const bookingApp = buildTestApp(BookingRoutes, '/api/booking');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'u1', email: 'u@x.com', name: 'U', role: 'USER',
  });
  (prisma.service.findUnique as any).mockResolvedValue({ id: 'svc1', title: 'P', amount: 5000 });
  // Mock $transaction to execute callback with prisma as tx
  (prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma));
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-23T12:00:00Z'));
});

describe('Booking create with discount', () => {
  it('no coupon, no auto-sale: subtotal = total, no BookingDiscount', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([]);
    (prisma.discount.findFirst as any).mockResolvedValue(null);
    (prisma.booking.create as any).mockResolvedValue({ id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000 });
    (prisma.payment.create as any).mockResolvedValue({ id: 'p1' });

    const res = await request(paymentApp)
      .post('/api/payment/initiate')
      .set(authHeader({ role: 'USER' }))
      .send({ serviceId: 'svc1', date: '2026-07-01T00:00:00Z' });

    expect(res.status).toBe(201);
    const bookingArgs = (prisma.booking.create as any).mock.calls[0][0];
    expect(bookingArgs.data.subtotal).toBe(5000);
    expect(bookingArgs.data.discountAmount).toBe(0);
    expect(bookingArgs.data.totalAmount).toBe(5000);
    expect((prisma.bookingDiscount.create as any).mock.calls.length).toBe(0);
  });

  it('with coupon: writes BookingDiscount, drops total, increments usageCount', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([]); // no auto-sale
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'PERCENT', value: 10,
      usageCap: null, usageCount: 0, perCustomerLimit: null,
      minBookingAmount: null, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true, services: [],
    });
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    // Inside-tx re-read for cap guard: cap not hit, proceed
    (prisma.discount.findUnique as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'PERCENT', value: 10,
      usageCap: null, usageCount: 0, perCustomerLimit: null,
      minBookingAmount: null, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true, services: [],
    });
    (prisma.booking.create as any).mockResolvedValue({ id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000 });
    (prisma.booking.update as any).mockResolvedValue({ id: 'b1', subtotal: 5000, discountAmount: 500, totalAmount: 4500 });
    (prisma.payment.create as any).mockResolvedValue({ id: 'p1' });
    (prisma.bookingDiscount.create as any).mockResolvedValue({ id: 'bd1' });
    (prisma.discount.update as any).mockResolvedValue({});

    const res = await request(paymentApp)
      .post('/api/payment/initiate')
      .set(authHeader({ role: 'USER' }))
      .send({ serviceId: 'svc1', date: '2026-07-01T00:00:00Z', couponCode: 'eid10' });

    expect(res.status).toBe(201);

    // Booking created with subtotal + zero discount first
    const bookingCreateArgs = (prisma.booking.create as any).mock.calls[0][0];
    expect(bookingCreateArgs.data.subtotal).toBe(5000);
    expect(bookingCreateArgs.data.discountAmount).toBe(0);
    expect(bookingCreateArgs.data.totalAmount).toBe(5000);

    // Then booking updated with discount applied
    const bookingUpdateArgs = (prisma.booking.update as any).mock.calls[0][0];
    expect(bookingUpdateArgs.data.discountAmount).toBe(500);
    expect(bookingUpdateArgs.data.totalAmount).toBe(4500);

    // BookingDiscount row created
    expect((prisma.bookingDiscount.create as any).mock.calls.length).toBe(1);

    // usageCount incremented
    expect((prisma.discount.update as any).mock.calls[0][0].data.usageCount).toEqual({ increment: 1 });

    // Payment uses discounted total
    const paymentCreateArgs = (prisma.payment.create as any).mock.calls[0][0];
    expect(paymentCreateArgs.data.totalAmount).toBe(4500);
  });

  it('service not found: throws NOT_FOUND error', async () => {
    (prisma.service.findUnique as any).mockResolvedValueOnce(null); // service lookup in booking.service fails

    const res = await request(paymentApp)
      .post('/api/payment/initiate')
      .set(authHeader({ role: 'USER' }))
      .send({ serviceId: 'invalid-svc', date: '2026-07-01T00:00:00Z' });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Service not found');
  });

  it('auto-sale with usageCap hit: not applied as candidate', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([
      {
        id: 'as1', kind: 'AUTO_SALE', type: 'PERCENT', value: 15,
        usageCap: 1, usageCount: 1, // cap hit
        minBookingAmount: null, maxDiscountAmount: null,
        validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
        active: true, services: [],
      },
    ]); // no eligible auto-sales (cap hit)
    (prisma.discount.findFirst as any).mockResolvedValue(null); // no coupon
    (prisma.booking.create as any).mockResolvedValue({ id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000 });
    (prisma.payment.create as any).mockResolvedValue({ id: 'p1' });

    const res = await request(paymentApp)
      .post('/api/payment/initiate')
      .set(authHeader({ role: 'USER' }))
      .send({ serviceId: 'svc1', date: '2026-07-01T00:00:00Z' });

    expect(res.status).toBe(201);

    // Booking created with no discount (auto-sale skipped due to cap)
    const bookingCreateArgs = (prisma.booking.create as any).mock.calls[0][0];
    expect(bookingCreateArgs.data.subtotal).toBe(5000);
    expect(bookingCreateArgs.data.discountAmount).toBe(0);
    expect(bookingCreateArgs.data.totalAmount).toBe(5000);

    // No BookingDiscount created (auto-sale filtered out)
    expect((prisma.bookingDiscount.create as any).mock.calls.length).toBe(0);
  });
});

describe('post-book ad-hoc discount', () => {
  it('replaces existing BookingDiscount, recomputes total', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' });
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000, userId: 'u1',
      payment: { id: 'p1', paidAmount: 0, totalAmount: 5000 },
      bookingDiscount: null,
    });
    (prisma.bookingDiscount.create as any).mockResolvedValue({ id: 'bd1' });
    (prisma.booking.update as any).mockResolvedValue({});
    (prisma.payment.update as any).mockResolvedValue({});

    const res = await request(bookingApp)
      .post('/api/booking/b1/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ type: 'FLAT', value: 1000, reason: 'Loyal customer' });

    expect(res.status).toBe(200);
    const bdArgs = (prisma.bookingDiscount.create as any).mock.calls[0][0];
    expect(bdArgs.data.source).toBe('AD_HOC');
    expect(bdArgs.data.amount).toBe(1000);
    const bookingArgs = (prisma.booking.update as any).mock.calls[0][0];
    expect(bookingArgs.data.discountAmount).toBe(1000);
    expect(bookingArgs.data.totalAmount).toBe(4000);
  });

  it('sets refundDueAmount when paidAmount > new total', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' });
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000, userId: 'u1',
      payment: { id: 'p1', paidAmount: 5000, totalAmount: 5000 },
      bookingDiscount: null,
    });
    (prisma.bookingDiscount.create as any).mockResolvedValue({ id: 'bd1' });
    (prisma.booking.update as any).mockResolvedValue({});
    (prisma.payment.update as any).mockResolvedValue({});
    const res = await request(bookingApp)
      .post('/api/booking/b1/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ type: 'PERCENT', value: 20, reason: 'thank you' });
    expect(res.status).toBe(200);
    const payArgs = (prisma.payment.update as any).mock.calls[0][0];
    expect(payArgs.data.refundDueAmount).toBe(1000);
    expect(payArgs.data.totalAmount).toBe(4000);
  });

  it('DELETE restores total + clears refundDueAmount', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' });
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1', subtotal: 5000, discountAmount: 1000, totalAmount: 4000, userId: 'u1',
      payment: { id: 'p1', paidAmount: 4000, totalAmount: 4000, refundDueAmount: 0 },
      bookingDiscount: { id: 'bd1', source: 'AD_HOC', discountId: null },
    });
    (prisma.bookingDiscount.delete as any).mockResolvedValue({});
    (prisma.booking.update as any).mockResolvedValue({});
    (prisma.payment.update as any).mockResolvedValue({});
    const res = await request(bookingApp)
      .delete('/api/booking/b1/discounts')
      .set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
    const bookingArgs = (prisma.booking.update as any).mock.calls[0][0];
    expect(bookingArgs.data.discountAmount).toBe(0);
    expect(bookingArgs.data.totalAmount).toBe(5000);
    const payArgs = (prisma.payment.update as any).mock.calls[0][0];
    expect(payArgs.data.refundDueAmount).toBe(0);
  });

  it('rejects PERCENT value > 100', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' });
    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1', subtotal: 5000, discountAmount: 0, totalAmount: 5000, userId: 'u1',
      payment: { id: 'p1', paidAmount: 0, totalAmount: 5000 },
      bookingDiscount: null,
    });
    const res = await request(bookingApp)
      .post('/api/booking/b1/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ type: 'PERCENT', value: 200, reason: 'oops' });
    expect(res.status).toBe(400);
  });
});

describe('Booking delete with discount', () => {
  it('DELETE /api/booking/:id with COUPON discount → decrement usageCount', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN',
    });
    (prisma.bookingDiscount.findUnique as any).mockResolvedValue({
      id: 'bd1',
      bookingId: 'b1',
      discountId: 'd1',
      source: 'COUPON',
    });
    (prisma.discount.update as any).mockResolvedValue({ id: 'd1', usageCount: 4 });
    (prisma.booking.delete as any).mockResolvedValue({ id: 'b1' });

    const res = await request(bookingApp)
      .delete('/api/booking/b1')
      .set(authHeader({ role: 'ADMIN' }));

    expect(res.status).toBe(200);
    // Verify discount.update was called with decrement
    expect((prisma.discount.update as any).mock.calls.length).toBe(1);
    const discountUpdateArgs = (prisma.discount.update as any).mock.calls[0][0];
    expect(discountUpdateArgs.where.id).toBe('d1');
    expect(discountUpdateArgs.data.usageCount).toEqual({ decrement: 1 });
    // Verify booking.delete was called
    expect((prisma.booking.delete as any).mock.calls.length).toBe(1);
  });

  it('DELETE /api/booking/:id with AD_HOC discount (discountId=null) → no discount update', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN',
    });
    (prisma.bookingDiscount.findUnique as any).mockResolvedValue({
      id: 'bd1',
      bookingId: 'b1',
      discountId: null, // AD_HOC has no linked discount
      source: 'AD_HOC',
    });
    (prisma.booking.delete as any).mockResolvedValue({ id: 'b1' });

    const res = await request(bookingApp)
      .delete('/api/booking/b1')
      .set(authHeader({ role: 'ADMIN' }));

    expect(res.status).toBe(200);
    // Verify discount.update was NOT called (discountId is null)
    expect((prisma.discount.update as any).mock.calls.length).toBe(0);
    // Verify booking.delete was called
    expect((prisma.booking.delete as any).mock.calls.length).toBe(1);
  });

  it('DELETE /api/booking/:id with no BookingDiscount → no discount update', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN',
    });
    (prisma.bookingDiscount.findUnique as any).mockResolvedValue(null); // no discount at all
    (prisma.booking.delete as any).mockResolvedValue({ id: 'b1' });

    const res = await request(bookingApp)
      .delete('/api/booking/b1')
      .set(authHeader({ role: 'ADMIN' }));

    expect(res.status).toBe(200);
    // Verify discount.update was NOT called (no booking discount)
    expect((prisma.discount.update as any).mock.calls.length).toBe(0);
    // Verify booking.delete was called
    expect((prisma.booking.delete as any).mock.calls.length).toBe(1);
  });
});

describe('Booking GET with bookingDiscount', () => {
  it('GET /api/booking/:id includes bookingDiscount when present', async () => {
    const mockBookingDiscount = {
      id: 'bd1',
      bookingId: 'b1',
      discountId: 'd1',
      source: 'COUPON',
      type: 'PERCENT',
      value: 10,
      amount: 500,
      createdAt: new Date('2026-06-23T12:00:00Z'),
      discount: {
        code: 'EID10',
        name: 'Eid Discount 10%',
      },
    };

    (prisma.booking.findUnique as any).mockResolvedValue({
      id: 'b1',
      userId: 'u1',
      serviceId: 'svc1',
      subtotal: 5000,
      discountAmount: 500,
      totalAmount: 4500,
      date: new Date('2026-07-01'),
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '1234567890',
      notes: null,
      status: 'CONFIRMED',
      createdAt: new Date('2026-06-23T12:00:00Z'),
      updatedAt: new Date('2026-06-23T12:00:00Z'),
      deliveryFolderId: null,
      deliveryFolderName: null,
      deliveredAt: null,
      printLimit: null,
      user: { id: 'u1', name: 'U', email: 'u@x.com' },
      service: { id: 'svc1', title: 'P', amount: 5000 },
      events: [],
      bookingDiscount: mockBookingDiscount,
    });

    const res = await request(bookingApp)
      .get('/api/booking/b1')
      .set(authHeader({ role: 'USER' }));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.bookingDiscount).toBeDefined();
    expect(res.body.data.bookingDiscount).not.toBeNull();
    expect(res.body.data.bookingDiscount.id).toBe('bd1');
    expect(res.body.data.bookingDiscount.bookingId).toBe('b1');
    expect(res.body.data.bookingDiscount.discountId).toBe('d1');
    expect(res.body.data.bookingDiscount.discount).toBeDefined();
    expect(res.body.data.bookingDiscount.discount.code).toBe('EID10');
    expect(res.body.data.bookingDiscount.discount.name).toBe('Eid Discount 10%');
  });
});
