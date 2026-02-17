process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.ADMIN_TOKEN = 'test-token';
const request = require('supertest');
const app = require('../index');
const { getDb } = require('../db/database');

const auth = { Authorization: 'Bearer test-token' };

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM sections').run();
  db.prepare('DELETE FROM requests').run();
  db.prepare('DELETE FROM players').run();
  db.prepare('DELETE FROM legend_entries').run();
});

describe('GET /api/admin/requests', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/requests');
    expect(res.status).toBe(401);
  });
  test('returns all requests with auth', async () => {
    const db = getDb();
    db.prepare('INSERT INTO requests (player_name,x,y,width,height,gold_cost) VALUES (?,?,?,?,?,?)').run('Thorn',0,0,1,1,10);
    const res = await request(app).get('/api/admin/requests').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('PUT /api/admin/requests/:id - approve', () => {
  test('approves request, unlocks section, deducts gold', async () => {
    const db = getDb();
    db.prepare('INSERT INTO players (name, gold_balance) VALUES (?,?)').run('Thorn', 50);
    const req = db.prepare('INSERT INTO requests (player_name,x,y,width,height,gold_cost) VALUES (?,?,?,?,?,?)').run('Thorn',0,0,1,1,10);
    const res = await request(app)
      .put(`/api/admin/requests/${req.lastInsertRowid}`)
      .set(auth).send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    const section = db.prepare('SELECT * FROM sections WHERE x=0 AND y=0').get();
    expect(section.is_unlocked).toBe(1);
    const player = db.prepare("SELECT * FROM players WHERE name='Thorn'").get();
    expect(player.gold_balance).toBe(40);
  });
});

describe('POST /api/admin/sections', () => {
  test('directly unlocks a section', async () => {
    const res = await request(app)
      .post('/api/admin/sections').set(auth).send({ x: 5, y: 5, width: 2, height: 2 });
    expect(res.status).toBe(201);
    expect(res.body.is_unlocked).toBe(1);
  });
});

describe('Players CRUD', () => {
  test('creates a player', async () => {
    const res = await request(app).post('/api/admin/players').set(auth).send({ name: 'Bram', gold_balance: 50 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Bram');
  });
  test('updates gold balance', async () => {
    const db = getDb();
    const p = db.prepare('INSERT INTO players (name, gold_balance) VALUES (?,?)').run('Cleo', 20);
    const res = await request(app)
      .put(`/api/admin/players/${p.lastInsertRowid}`).set(auth).send({ gold_balance: 75 });
    expect(res.status).toBe(200);
    expect(res.body.gold_balance).toBe(75);
  });
});

describe('Legend CRUD', () => {
  test('creates a legend entry', async () => {
    const res = await request(app).post('/api/admin/legend').set(auth)
      .send({ symbol: 'M', label: 'Mountain', description: 'Snowy peaks' });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Mountain');
  });
  test('deletes a legend entry', async () => {
    const db = getDb();
    const e = db.prepare("INSERT INTO legend_entries (symbol,label) VALUES ('W','Ocean')").run();
    const res = await request(app).delete(`/api/admin/legend/${e.lastInsertRowid}`).set(auth);
    expect(res.status).toBe(204);
  });
});
