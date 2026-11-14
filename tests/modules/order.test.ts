import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { OrderRoutes } from '../../src/app/modules/order/order.router';
import { OrderService } from '../../src/app/modules/order/order.service';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(OrderRoutes, '/api/order');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 'tester@example.com',
    name: 'Tester',
    role: 'ADMIN',
  });
});

describe('OrderService', () => {
  it('createOrder calculates total from looked-up product prices', async () => {
    (prisma.product.findMany as any).mockResolvedValue([
      { id: 'p1', price: 10 },
      { id: 'p2', price: 20 },
    ]);
    (prisma.order.create as any).mockResolvedValue({ id: 'o1', total: 70 });

    await OrderService.createOrder({
      userId: 'u1',
      items: [
        { productId: 'p1', quantity: 3 },
        { productId: 'p2', quantity: 2 },
      ],
    });

    const args = (prisma.order.create as any).mock.calls[0][0];
    expect(args.data.total).toBe(70);
    expect(args.data.items.create).toHaveLength(2);
  });

  it('createOrder rejects when an item references an unknown product', async () => {
    (prisma.product.findMany as any).mockResolvedValue([{ id: 'p1', price: 10 }]);
    await expect(
      OrderService.createOrder({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 1 }, { productId: 'missing', quantity: 1 }],
      }),
    ).rejects.toThrow();
  });

  it('createOrder rejects an empty items array', async () => {
    await expect(
      OrderService.createOrder({ userId: 'u1', items: [] }),
    ).rejects.toThrow();
  });
});

describe('Order routes', () => {
  it('GET / returns paginated orders', async () => {
    (prisma.order.findMany as any).mockResolvedValue([
      { id: 'o1', total: 100, status: 'PENDING', items: [] },
    ]);
    (prisma.order.count as any).mockResolvedValue(1);
    const res = await request(app).get('/api/order').set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('PATCH /:id updates order status', async () => {
    (prisma.order.update as any).mockResolvedValue({
      id: 'o1',
      status: 'PAID',
    });
    const res = await request(app)
      .patch('/api/order/o1')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ status: 'PAID' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PAID');
  });
});
