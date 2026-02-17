process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
const { getDb } = require('./database');

describe('database', () => {
  test('initializes and returns a db instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  test('sections table exists', () => {
    const db = getDb();
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sections'").get();
    expect(row.name).toBe('sections');
  });

  test('settings table has default gold costs', () => {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key='gold_costs'").get();
    const costs = JSON.parse(row.value);
    expect(costs['1x1']).toBe(10);
  });
});
