process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.ADMIN_TOKEN = 'test-token';
const request = require('supertest');
const app = require('../index');
const { getDb } = require('../db/database');
const bcrypt = require('bcryptjs');

beforeAll(() => {
  const db = getDb();
  const hash = bcrypt.hashSync('testpassword', 10);
  db.prepare("UPDATE settings SET value=? WHERE key='admin_password_hash'").run(hash);
});

describe('POST /api/admin/login', () => {
  test('returns token on correct password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
