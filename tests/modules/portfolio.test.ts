import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { PortfolioRoutes } from '../../src/app/modules/portfolio/portfolio.router';
import { PortfolioService } from '../../src/app/modules/portfolio/portfolio.service';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(PortfolioRoutes, '/api/portfolio');

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({
    id: 'admin-id',
    email: 'tester@example.com',
    name: 'Tester',
    role: 'ADMIN',
  });
});

describe('PortfolioService', () => {
  const row = (over = {}) => ({
    id: 'pf1',
    image: 'a.jpg',
    sortOrder: 3,
    categories: [{ category: { id: 'c1', name: 'Wedding' } }],
    ...over,
  });

  it('createPortfolio links categories, uses next sort order by default', async () => {
    (prisma.portfolioCategory.count as any).mockResolvedValue(2);
    (prisma.portfolio.aggregate as any).mockResolvedValue({ _max: { sortOrder: 9 } });
    (prisma.portfolio.create as any).mockResolvedValue(row());
    const out = await PortfolioService.createPortfolio({ image: 'a.jpg', categoryIds: ['c1', 'c2', 'c1'] });
    const args = (prisma.portfolio.create as any).mock.calls[0][0];
    expect(args.data.sortOrder).toBe(10);
    expect(args.data.categories.create).toEqual([{ categoryId: 'c1' }, { categoryId: 'c2' }]);
    expect(out.categories).toEqual([{ id: 'c1', name: 'Wedding' }]);
  });

  it('createPortfolio keeps an explicit sort order', async () => {
    (prisma.portfolioCategory.count as any).mockResolvedValue(1);
    (prisma.portfolio.create as any).mockResolvedValue(row());
    await PortfolioService.createPortfolio({ image: 'a.jpg', categoryIds: ['c1'], sortOrder: 5 });
    expect((prisma.portfolio.create as any).mock.calls.at(-1)[0].data.sortOrder).toBe(5);
  });

  it('createPortfolio rejects unknown categories', async () => {
    (prisma.portfolioCategory.count as any).mockResolvedValue(0);
    await expect(
      PortfolioService.createPortfolio({ image: 'a.jpg', categoryIds: ['nope'] }),
    ).rejects.toThrow(/do not exist/);
  });

  it('getAllPortfolios filters by category and orders by sortOrder asc', async () => {
    (prisma.portfolio.findMany as any).mockResolvedValue([]);
    (prisma.portfolio.count as any).mockResolvedValue(0);
    await PortfolioService.getAllPortfolios({ categoryId: 'c1' });
    const a = (prisma.portfolio.findMany as any).mock.calls.at(-1)[0];
    expect(a.where.categories).toEqual({ some: { categoryId: 'c1' } });
    expect(a.orderBy[0]).toEqual({ sortOrder: 'asc' });
    expect(a.orderBy.length).toBeGreaterThan(1);
  });

  it('updatePortfolio only touches sortOrder when supplied', async () => {
    (prisma.portfolio.update as any).mockResolvedValue(row());
    await PortfolioService.updatePortfolio('pf1', { title: 'x' });
    expect((prisma.portfolio.update as any).mock.calls.at(-1)[0].data.sortOrder).toBeUndefined();
  });

  it('updatePortfolio replaces categories when supplied', async () => {
    (prisma.portfolioCategory.count as any).mockResolvedValue(1);
    (prisma.portfolio.update as any).mockResolvedValue(row());
    await PortfolioService.updatePortfolio('pf1', { categoryIds: ['c2'] });
    const d = (prisma.portfolio.update as any).mock.calls.at(-1)[0].data;
    expect(d.categories).toEqual({ deleteMany: {}, create: [{ categoryId: 'c2' }] });
  });
});

describe('Portfolio routes', () => {
  it('POST /create-portfolio rejects when image is missing', async () => {
    const res = await request(app)
      .post('/api/portfolio/create-portfolio')
      .set(authHeader({ role: 'ADMIN' }))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /create-portfolio rejects when no category given', async () => {
    const res = await request(app)
      .post('/api/portfolio/create-portfolio')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ image: 'a.jpg' });
    expect(res.status).toBe(400);
  });

  it('POST /create-portfolio creates with category + sort number', async () => {
    (prisma.portfolioCategory.count as any).mockResolvedValue(1);
    (prisma.portfolio.create as any).mockResolvedValue({ id: 'pf1', image: 'a.jpg', categories: [] });
    const res = await request(app)
      .post('/api/portfolio/create-portfolio')
      .set(authHeader({ role: 'ADMIN' }))
      .send({ image: 'a.jpg', categoryIds: ['c1'], sortOrder: 4 });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('pf1');
  });

  it('POST /create-portfolio requires auth', async () => {
    const res = await request(app)
      .post('/api/portfolio/create-portfolio')
      .send({ image: 'a.jpg', categoryIds: ['c1'] });
    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
