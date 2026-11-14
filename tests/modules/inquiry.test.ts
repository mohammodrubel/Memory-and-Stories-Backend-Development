import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import { InquiryRoutes } from '../../src/app/modules/inquiry/inquiry.router';
import { buildTestApp, authHeader } from '../helpers/app';

const app = buildTestApp(InquiryRoutes, '/api/inquiry');
const valid = { name: 'Rahim', email: 'r@example.com', phone: '+8801700000000', message: 'Need wedding photography.' };

beforeEach(() => {
  (prisma.user.findUnique as any).mockResolvedValue({ id: 'a', email: 'a@x.com', name: 'A', role: 'ADMIN' });
});

describe('Inquiry routes', () => {
  it('POST creates inquiry without auth', async () => {
    (prisma.inquiry.create as any).mockResolvedValue({ id: 'i1' });
    const res = await request(app).post('/api/inquiry').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('i1');
  });
  it('POST rejects invalid email / short message', async () => {
    const res = await request(app).post('/api/inquiry').send({ ...valid, email: 'nope', message: 'hi' });
    expect(res.status).toBe(400);
  });
  it('POST rejects honeypot', async () => {
    const res = await request(app).post('/api/inquiry').send({ ...valid, website: 'spam' });
    expect(res.status).toBe(400);
  });
  it('GET requires admin', async () => {
    const res = await request(app).get('/api/inquiry');
    expect(res.status).toBeGreaterThanOrEqual(401);
  });
  it('GET lists for admin', async () => {
    (prisma.inquiry.findMany as any).mockResolvedValue([]);
    (prisma.inquiry.count as any).mockResolvedValue(0);
    const res = await request(app).get('/api/inquiry').set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
  });
});
