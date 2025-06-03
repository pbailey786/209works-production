import request from 'supertest';
import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let server: any;

beforeAll(async () => {
  await app.prepare();
  server = createServer((req, res) => handle(req, res));
  await new Promise<void>(resolve => server.listen(3001, resolve));
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(resolve));
});

describe('GET /api/jobs/search', () => {
  it('should return 200 and a valid response for a basic search', async () => {
    const res = await request('http://localhost:3001')
      .get('/api/jobs/search?q=developer')
      .expect(200);
    expect(res.body).toBeDefined();
    // Optionally check for expected fields
    // expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});
