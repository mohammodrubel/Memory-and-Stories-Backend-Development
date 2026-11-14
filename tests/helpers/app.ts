import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import globalErrorHandler from '../../src/app/middlewares/globalErrorHandler';
import notFound from '../../src/app/middlewares/notFound';

export type TestUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
};

export const buildTestApp = (router: express.Router, basePath = '/api') => {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(basePath, router);
  app.use(globalErrorHandler);
  app.use(notFound);
  return app;
};

export const tokenFor = (user: Partial<TestUser> = {}) => {
  const payload = {
    id: user.id ?? 'test-user-id',
    email: user.email ?? 'tester@example.com',
    name: user.name ?? 'Tester',
    role: user.role ?? 'ADMIN',
  };
  return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
};

export const authHeader = (user: Partial<TestUser> = {}) => ({
  Authorization: `Bearer ${tokenFor(user)}`,
});
