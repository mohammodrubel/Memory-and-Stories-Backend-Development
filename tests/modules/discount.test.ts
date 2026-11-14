import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { DiscountRoutes } from '../../src/app/modules/discount/discount.router';
import { buildTestApp, authHeader } from '../helpers/app';
import { resolveAutoSaleForService } from '../../src/app/modules/discount/discount.service';

const app = buildTestApp(DiscountRoutes, '/api/discounts');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 't@example.com',
    name: 'T',
    role: 'ADMIN',
  });
});

describe('Discount CRUD', () => {
  it('POST /api/discounts creates a coupon', async () => {
    (prisma.discount.create as any).mockResolvedValue({ id: 'd1' });
    const res = await request(app)
      .post('/api/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({
        name: 'Eid sale',
        kind: 'COUPON',
        code: 'eid20',
        type: 'PERCENT',
        value: 20,
        validFrom: '2026-06-23T00:00:00Z',
        validTo: '2026-07-23T00:00:00Z',
        maxDiscountAmount: 2000,
      });
    expect(res.status).toBe(200);
    const args = (prisma.discount.create as any).mock.calls[0][0];
    expect(args.data.code).toBe('EID20'); // uppercased
    expect(args.data.kind).toBe('COUPON');
  });

  it('POST /api/discounts rejects COUPON without code', async () => {
    const res = await request(app)
      .post('/api/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({
        name: 'No code',
        kind: 'COUPON',
        type: 'FLAT',
        value: 100,
        validFrom: '2026-06-23T00:00:00Z',
        validTo: '2026-07-23T00:00:00Z',
      });
    expect(res.status).toBe(400);
  });

  it('POST /api/discounts rejects AUTO_SALE with code', async () => {
    const res = await request(app)
      .post('/api/discounts')
      .set(authHeader({ role: 'ADMIN' }))
      .send({
        name: 'Bad',
        kind: 'AUTO_SALE',
        code: 'XYZ',
        type: 'FLAT',
        value: 100,
        validFrom: '2026-06-23T00:00:00Z',
        validTo: '2026-07-23T00:00:00Z',
      });
    expect(res.status).toBe(400);
  });

  it('GET /api/discounts lists with filter', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([]);
    (prisma.discount.count as any).mockResolvedValue(0);
    const res = await request(app)
      .get('/api/discounts?kind=COUPON&active=true')
      .set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
    const where = (prisma.discount.findMany as any).mock.calls[0][0].where;
    expect(where.kind).toBe('COUPON');
    expect(where.active).toBe(true);
  });

  it('DELETE /api/discounts/:id soft-deletes', async () => {
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    (prisma.discount.update as any).mockResolvedValue({ id: 'd1', active: false });
    const res = await request(app)
      .delete('/api/discounts/d1')
      .set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
    const args = (prisma.discount.update as any).mock.calls[0][0];
    expect(args.data.active).toBe(false);
  });

  it('PATCH /api/discounts/:id rejects switching to COUPON without code', async () => {
    // Validation should reject before DB call, but we mock anyway for safety
    (prisma.discount.findUnique as any).mockResolvedValue({ id: 'd1', kind: 'AUTO_SALE' });
    const res = await request(app)
      .patch('/api/discounts/d1')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ kind: 'COUPON' });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/discounts/:id rejects AUTO_SALE with code', async () => {
    // Validation should reject before DB call, but we mock anyway for safety
    (prisma.discount.findUnique as any).mockResolvedValue({ id: 'd1', kind: 'COUPON', code: 'ABC' });
    const res = await request(app)
      .patch('/api/discounts/d1')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ kind: 'AUTO_SALE', code: 'XYZ' });
    expect(res.status).toBe(400);
  });

  it('GET /api/discounts/:id returns discount with _count.redemptions', async () => {
    (prisma.discount.findUnique as any).mockResolvedValue({
      id: 'd1',
      name: 'Test Discount',
      kind: 'COUPON',
      type: 'PERCENT',
      value: 10,
      code: 'TEST10',
      active: true,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2027-01-01'),
      usageCap: null,
      usageCount: 0,
      perCustomerLimit: null,
      minBookingAmount: null,
      maxDiscountAmount: null,
      createdById: 'admin-id',
      createdAt: new Date('2026-06-01'),
      updatedAt: new Date('2026-06-01'),
      services: [],
      _count: { redemptions: 7 },
    });

    const res = await request(app)
      .get('/api/discounts/d1')
      .set(authHeader({ role: 'ADMIN' }));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data._count).toBeDefined();
    expect(res.body.data._count.redemptions).toBe(7);
  });
});

describe('validate-coupon', () => {
  const SVC_ID = '11111111-2222-4111-8111-111111111111';
  const baseService = { id: SVC_ID, amount: 5000 };
  const now = new Date('2026-06-23T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    (prisma.service.findUnique as any).mockResolvedValue(baseService);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'test-user-id',
      email: 'tester@example.com',
      name: 'Tester',
      role: 'USER',
    });
  });

  it('valid coupon returns amount', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1',
      kind: 'COUPON',
      type: 'PERCENT',
      value: 10,
      maxDiscountAmount: 1000,
      minBookingAmount: null,
      usageCap: null,
      usageCount: 0,
      perCustomerLimit: null,
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-07-01'),
      active: true,
      services: [],
    });
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);

    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .send({ code: 'eid10', serviceId: SVC_ID });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.amount).toBe(500);
  });

  it('expired coupon rejected', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .send({ code: 'old', serviceId: SVC_ID });
    expect(res.body.data.valid).toBe(false);
  });

  it('usage cap reached rejects', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'FLAT', value: 100,
      usageCap: 5, usageCount: 5,
      perCustomerLimit: null, minBookingAmount: null, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true, services: [],
    });
    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .send({ code: 'capped', serviceId: SVC_ID });
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toMatch(/usage/i);
  });

  it('per-customer limit hit rejects', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'FLAT', value: 100,
      usageCap: null, usageCount: 0,
      perCustomerLimit: 1, minBookingAmount: null, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true, services: [],
    });
    (prisma.bookingDiscount.count as any).mockResolvedValue(1);
    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .set(authHeader({ role: 'USER' }))
      .send({ code: 'once', serviceId: SVC_ID });
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toMatch(/already used/i);
  });

  it('min amount not met rejects', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'FLAT', value: 500,
      usageCap: null, usageCount: 0,
      perCustomerLimit: null, minBookingAmount: 10000, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true, services: [],
    });
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .send({ code: 'big', serviceId: SVC_ID });
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toMatch(/minimum/i);
  });

  it('wrong service rejects', async () => {
    (prisma.discount.findFirst as any).mockResolvedValue({
      id: 'd1', kind: 'COUPON', type: 'FLAT', value: 100,
      usageCap: null, usageCount: 0,
      perCustomerLimit: null, minBookingAmount: null, maxDiscountAmount: null,
      validFrom: new Date('2026-01-01'), validTo: new Date('2027-01-01'),
      active: true,
      services: [{ discountId: 'd1', serviceId: '22222222-3333-4222-8222-222222222222' }],
    });
    (prisma.bookingDiscount.count as any).mockResolvedValue(0);
    const res = await request(app)
      .post('/api/discounts/validate-coupon')
      .send({ code: 'wrong', serviceId: SVC_ID });
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toMatch(/service/i);
  });
});

describe('resolveAutoSaleForService', () => {
  const SVC_ID = 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa';

  it('returns sale info when an active AUTO_SALE matches', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([
      {
        id: 'auto-d1',
        kind: 'AUTO_SALE',
        type: 'PERCENT',
        value: 10,
        maxDiscountAmount: null,
        usageCap: null,
        usageCount: 0,
        active: true,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-01-01'),
      },
    ]);

    const result = await resolveAutoSaleForService(SVC_ID, 5000);

    expect(result).not.toBeNull();
    expect(result?.discountId).toBe('auto-d1');
    expect(result?.type).toBe('PERCENT');
    expect(result?.value).toBe(10);
    expect(result?.amount).toBe(500); // 10% of 5000
  });

  it('returns null when no AUTO_SALE candidates exist', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([]);

    const result = await resolveAutoSaleForService(SVC_ID, 5000);
    expect(result).toBeNull();
  });

  it('returns null when all candidates are cap-exhausted', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([
      {
        id: 'auto-d2',
        kind: 'AUTO_SALE',
        type: 'FLAT',
        value: 200,
        maxDiscountAmount: null,
        usageCap: 5,
        usageCount: 5,
        active: true,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-01-01'),
      },
    ]);

    const result = await resolveAutoSaleForService(SVC_ID, 5000);
    expect(result).toBeNull();
  });

  it('picks the highest-value discount when multiple exist', async () => {
    (prisma.discount.findMany as any).mockResolvedValue([
      {
        id: 'low',
        kind: 'AUTO_SALE',
        type: 'FLAT',
        value: 100,
        maxDiscountAmount: null,
        usageCap: null,
        usageCount: 0,
        active: true,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-01-01'),
      },
      {
        id: 'high',
        kind: 'AUTO_SALE',
        type: 'FLAT',
        value: 800,
        maxDiscountAmount: null,
        usageCap: null,
        usageCount: 0,
        active: true,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-01-01'),
      },
    ]);

    const result = await resolveAutoSaleForService(SVC_ID, 5000);
    expect(result?.discountId).toBe('high');
    expect(result?.amount).toBe(800);
  });
});
