import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import prisma from '../../src/app/utils/prisma';
import auth from '../../src/app/middlewares/auth';
import globalErrorHandler from '../../src/app/middlewares/globalErrorHandler';
import { authHeader } from '../helpers/app';

const buildApp = (allowedRoles: ('ADMIN' | 'USER')[] = []) => {
  const app = express();
  app.use(express.json());
  app.get('/protected', auth(...allowedRoles), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(globalErrorHandler);
  return app;
};

beforeEach(() => {
  (prisma.user.findUnique as any).mockReset();
});

describe('auth middleware', () => {
  it('rejects requests with no Authorization header', async () => {
    const app = buildApp();
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed bearer token', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'NotBearer xxx');
    expect(res.status).toBe(401);
  });

  it('rejects when the user from the token is not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const app = buildApp();
    const res = await request(app).get('/protected').set(authHeader());
    expect(res.status).toBe(401);
  });

  it('allows the request through when the role matches', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u',
      email: 'a@x.io',
      role: 'ADMIN',
    });
    const app = buildApp(['ADMIN']);
    const res = await request(app)
      .get('/protected')
      .set(authHeader({ role: 'ADMIN' }));
    expect(res.status).toBe(200);
  });

  it('returns 403 when the user has the wrong role', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u',
      email: 'a@x.io',
      role: 'USER',
    });
    const app = buildApp(['ADMIN']);
    const res = await request(app)
      .get('/protected')
      .set(authHeader({ role: 'USER' }));
    expect(res.status).toBe(403);
  });

  it('allows any authenticated user when no roles are required', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u',
      email: 'a@x.io',
      role: 'USER',
    });
    const app = buildApp();
    const res = await request(app).get('/protected').set(authHeader());
    expect(res.status).toBe(200);
  });
});
