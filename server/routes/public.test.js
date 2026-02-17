process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
const request = require('supertest');
const app = require('../index');
const { getDb } = require('../db/database');

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM sections').run();
  db.prepare('DELETE FROM requests').run();
  db.prepare('DELETE FROM legend_entries').run();
});

describe('GET /api/sections', () => {
  test('returns only unlocked sections', async () => {
    const db = getDb();
    db.prepare('INSERT INTO sections (x,y,width,height,is_unlocked) VALUES (0,0,1,1,1)').run();
    db.prepare('INSERT INTO sections (x,y,width,height,is_unlocked) VALUES (1,0,1,1,0)').run();
    const res = await request(app).get('/api/sections');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('GET /api/legend', () => {
  test('returns all legend entries', async () => {
    const db = getDb();
    db.prepare("INSERT INTO legend_entries (symbol,label) VALUES ('F','Forest')").run();
    const res = await request(app).get('/api/legend');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('POST /api/requests', () => {
  test('creates a pending request', async () => {
    const res = await request(app).post('/api/requests')
      .send({ player_name: 'Thorn', message: 'Found ruins', x: 2, y: 3, width: 1, height: 1 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('rejects request missing player_name', async () => {
    const res = await request(app).post('/api/requests').send({ x: 2, y: 3 });
    expect(res.status).toBe(400);
  });
});
