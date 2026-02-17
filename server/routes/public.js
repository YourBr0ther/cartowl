const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

router.get('/sections', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM sections WHERE is_unlocked=1').all());
});

router.get('/legend', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM legend_entries').all());
});

router.post('/requests', (req, res) => {
  const { player_name, message, x, y, width, height } = req.body;
  if (!player_name) return res.status(400).json({ error: 'player_name required' });
  if (x == null || y == null) return res.status(400).json({ error: 'x and y required' });

  const db = getDb();
  const setting = db.prepare("SELECT value FROM settings WHERE key='gold_costs'").get();
  const costs = JSON.parse(setting.value);
  const sizeKey = `${width || 1}x${height || 1}`;
  const gold_cost = costs[sizeKey] || costs['1x1'];

  const result = db.prepare(
    'INSERT INTO requests (player_name, message, x, y, width, height, gold_cost) VALUES (?,?,?,?,?,?,?)'
  ).run(player_name, message || '', x, y, width || 1, height || 1, gold_cost);

  res.status(201).json(db.prepare('SELECT * FROM requests WHERE id=?').get(result.lastInsertRowid));
});

module.exports = router;
