const express = require('express');
const { getDb } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/requests', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM requests ORDER BY created_at DESC').all());
});

router.put('/requests/:id', (req, res) => {
  const { action } = req.body;
  const db = getDb();
  const reqRow = db.prepare('SELECT * FROM requests WHERE id=?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Not found' });

  if (action === 'approve') {
    db.prepare(`
      INSERT INTO sections (x, y, width, height, is_unlocked, unlocked_at)
      VALUES (?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(x,y,width,height) DO UPDATE SET is_unlocked=1, unlocked_at=CURRENT_TIMESTAMP
    `).run(reqRow.x, reqRow.y, reqRow.width, reqRow.height);
    db.prepare('UPDATE players SET gold_balance = MAX(0, gold_balance - ?) WHERE name=?').run(reqRow.gold_cost, reqRow.player_name);
    db.prepare("UPDATE requests SET status='approved' WHERE id=?").run(req.params.id);
  } else if (action === 'reject') {
    db.prepare("UPDATE requests SET status='rejected' WHERE id=?").run(req.params.id);
  } else {
    return res.status(400).json({ error: 'action must be approve or reject' });
  }

  res.json(db.prepare('SELECT * FROM requests WHERE id=?').get(req.params.id));
});

router.post('/sections', (req, res) => {
  const { x, y, width = 1, height = 1 } = req.body;
  if (x == null || y == null) return res.status(400).json({ error: 'x and y required' });
  const db = getDb();
  db.prepare(`
    INSERT INTO sections (x, y, width, height, is_unlocked, unlocked_at)
    VALUES (?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(x,y,width,height) DO UPDATE SET is_unlocked=1, unlocked_at=CURRENT_TIMESTAMP
  `).run(x, y, width, height);
  res.status(201).json(db.prepare('SELECT * FROM sections WHERE x=? AND y=? AND width=? AND height=?').get(x, y, width, height));
});

router.get('/players', (req, res) => res.json(getDb().prepare('SELECT * FROM players').all()));

router.post('/players', (req, res) => {
  const { name, gold_balance = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO players (name, gold_balance) VALUES (?,?)').run(name, gold_balance);
  res.status(201).json(db.prepare('SELECT * FROM players WHERE id=?').get(result.lastInsertRowid));
});

router.put('/players/:id', (req, res) => {
  const { gold_balance } = req.body;
  const db = getDb();
  db.prepare('UPDATE players SET gold_balance=? WHERE id=?').run(gold_balance, req.params.id);
  res.json(db.prepare('SELECT * FROM players WHERE id=?').get(req.params.id));
});

router.get('/legend', (req, res) => res.json(getDb().prepare('SELECT * FROM legend_entries').all()));

router.post('/legend', (req, res) => {
  const { symbol, label, description } = req.body;
  if (!symbol || !label) return res.status(400).json({ error: 'symbol and label required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO legend_entries (symbol,label,description) VALUES (?,?,?)').run(symbol, label, description || '');
  res.status(201).json(db.prepare('SELECT * FROM legend_entries WHERE id=?').get(result.lastInsertRowid));
});

router.put('/legend/:id', (req, res) => {
  const { symbol, label, description } = req.body;
  const db = getDb();
  db.prepare('UPDATE legend_entries SET symbol=?, label=?, description=? WHERE id=?').run(symbol, label, description, req.params.id);
  res.json(db.prepare('SELECT * FROM legend_entries WHERE id=?').get(req.params.id));
});

router.delete('/legend/:id', (req, res) => {
  getDb().prepare('DELETE FROM legend_entries WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
