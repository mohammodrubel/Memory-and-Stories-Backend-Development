import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { UploadRoutes } from '../../src/app/modules/upload/upload.router';
import { buildTestApp } from '../helpers/app';

const app = buildTestApp(UploadRoutes, '/api/upload');
// Mount static handler the same way the real app does, so we can also assert the file is served.
app.use('/uploads', require('express').static(path.join(process.cwd(), 'uploads')));

const fixturePng = Buffer.from(
  // 1x1 transparent PNG
  '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082',
  'hex',
);

const fixtureTxt = Buffer.from('hello world', 'utf8');

const uploadsDir = path.join(process.cwd(), 'uploads');
const createdFiles: string[] = [];

beforeAll(() => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
});

afterAll(() => {
  for (const f of createdFiles) {
    const p = path.join(uploadsDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

describe('POST /api/upload/image', () => {
  it('rejects request without a file', async () => {
    const res = await request(app).post('/api/upload/image');
    expect(res.status).toBe(400);
  });

  it('rejects non-image mime types', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', fixtureTxt, { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts a PNG and returns a public URL', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .attach('image', fixturePng, { filename: 'pixel.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/\/uploads\/.+\.png$/);
    expect(res.body.data.mimetype).toBe('image/png');
    expect(res.body.data.size).toBeGreaterThan(0);
    createdFiles.push(res.body.data.filename);
  });
});

describe('POST /api/upload/images', () => {
  it('accepts multiple PNGs', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .attach('images', fixturePng, { filename: 'a.png', contentType: 'image/png' })
      .attach('images', fixturePng, { filename: 'b.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    for (const f of res.body.data) createdFiles.push(f.filename);
  });
});

describe('DELETE /api/upload/:filename', () => {
  it('rejects path traversal attempts', async () => {
    const res = await request(app).delete('/api/upload/..%2Fetc%2Fpasswd');
    expect(res.status).toBe(400);
  });

  it('404s on missing files', async () => {
    const res = await request(app).delete('/api/upload/does-not-exist.png');
    expect(res.status).toBe(404);
  });

  it('deletes an existing uploaded file', async () => {
    const upRes = await request(app)
      .post('/api/upload/image')
      .attach('image', fixturePng, { filename: 'doomed.png', contentType: 'image/png' });
    const filename: string = upRes.body.data.filename;
    const del = await request(app).delete(`/api/upload/${filename}`);
    expect(del.status).toBe(200);
    expect(fs.existsSync(path.join(uploadsDir, filename))).toBe(false);
  });
});
