import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { ProductRoutes } from '../../src/app/modules/product/product.router';
import { ProductService } from '../../src/app/modules/product/product.service';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(ProductRoutes, '/api/product');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 'tester@example.com',
    name: 'Tester',
    role: 'ADMIN',
  });
});

describe('ProductService', () => {
  it('createProduct coerces price to a number', async () => {
    (prisma.product.create as any).mockResolvedValue({
      id: 'p1',
      name: 'Lens',
      price: 99,
    });

    await ProductService.createProduct({
      name: 'Lens',
      price: '99' as any,
      image: 'lens.jpg',
    });

    const args = (prisma.product.create as any).mock.calls[0][0];
    expect(args.data.price).toBe(99);
    expect(typeof args.data.price).toBe('number');
  });

  it('getAllProducts applies price range filter', async () => {
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.product.count as any).mockResolvedValue(0);
    await ProductService.getAllProducts({ minPrice: 10, maxPrice: 100 });
    const where = (prisma.product.findMany as any).mock.calls[0][0].where;
    expect(where.price.gte).toBe(10);
    expect(where.price.lte).toBe(100);
  });
});

describe('Product routes', () => {
  it('POST /create-product validates required fields', async () => {
    const res = await request(app)
      .post('/api/product/create-product')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ name: 'No price' });
    expect(res.status).toBe(400);
  });

  it('POST /create-product accepts valid payload', async () => {
    (prisma.product.create as any).mockResolvedValue({
      id: 'p1',
      name: 'Camera',
      price: 999,
      image: 'cam.jpg',
    });
    const res = await request(app)
      .post('/api/product/create-product')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ name: 'Camera', price: 999, image: 'cam.jpg' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('p1');
  });

  it('GET / works without auth (public catalogue)', async () => {
    (prisma.product.findMany as any).mockResolvedValue([]);
    (prisma.product.count as any).mockResolvedValue(0);
    const res = await request(app).get('/api/product');
    expect(res.status).toBe(200);
  });
});
