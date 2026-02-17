const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

const router = express.Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'cartowl-dev-token';

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key='admin_password_hash'").get();

  if (!row || !row.value) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  const valid = bcrypt.compareSync(password, row.value);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  res.json({ token: ADMIN_TOKEN });
});

module.exports = router;
