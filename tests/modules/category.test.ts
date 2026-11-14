import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { CategoryRoutes } from '../../src/app/modules/category/category.router';
import { CategoryService } from '../../src/app/modules/category/category.service';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(CategoryRoutes, '/api/category');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 'tester@example.com',
    name: 'Tester',
    role: 'ADMIN',
  });
});

describe('CategoryService', () => {
  it('createCategory delegates to prisma.category.create', async () => {
    (prisma.category.create as any).mockResolvedValue({
      id: 'c1',
      name: 'Wedding',
    });

    const result = await CategoryService.createCategory({ name: 'Wedding' });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Wedding' },
    });
    expect(result).toEqual({ id: 'c1', name: 'Wedding' });
  });

  it('getAllCategories paginates and searches', async () => {
    (prisma.category.findMany as any).mockResolvedValue([
      { id: 'c1', name: 'Wedding' },
    ]);
    (prisma.category.count as any).mockResolvedValue(1);

    const result = await CategoryService.getAllCategories({
      searchTerm: 'wed',
      page: 2,
      limit: 5,
    });

    const findArgs = (prisma.category.findMany as any).mock.calls[0][0];
    expect(findArgs.skip).toBe(5);
    expect(findArgs.take).toBe(5);
    expect(findArgs.where.OR[0].name.contains).toBe('wed');
    expect(result.meta).toEqual({
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
  });

  it('updateCategory calls prisma.category.update', async () => {
    (prisma.category.update as any).mockResolvedValue({ id: 'c1', name: 'X' });
    const result = await CategoryService.updateCategory('c1', { name: 'X' });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { name: 'X' },
    });
    expect(result.name).toBe('X');
  });

  it('deleteCategory calls prisma.category.delete', async () => {
    (prisma.category.delete as any).mockResolvedValue({ id: 'c1' });
    await CategoryService.deleteCategory('c1');
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
  });
});

describe('Category routes', () => {
  it('POST /create-category returns 201 with the new category', async () => {
    (prisma.category.create as any).mockResolvedValue({
      id: 'c1',
      name: 'Wedding',
    });

    const res = await request(app)
      .post('/api/category/create-category')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ name: 'Wedding' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Wedding');
  });

  it('POST /create-category rejects an empty name', async () => {
    const res = await request(app)
      .post('/api/category/create-category')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('GET / returns categories with pagination meta', async () => {
    (prisma.category.findMany as any).mockResolvedValue([
      { id: 'c1', name: 'Wedding' },
    ]);
    (prisma.category.count as any).mockResolvedValue(1);

    const res = await request(app).get('/api/category').set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('DELETE /:id requires authorization header', async () => {
    const res = await request(app).delete('/api/category/c1');
    expect(res.status).toBe(401);
  });
});
