# Cartowl Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Cartowl — a D&D map web app where players request map sections from owl cartographers and the DM approves/rejects purchases via an admin panel.

**Architecture:** Single-container app — Express serves the REST API and in production serves the compiled React (Vite) bundle. SQLite via `better-sqlite3` for persistence. Admin is password-protected; player view is public/shared.

**Tech Stack:** Node.js 20, Express 4, better-sqlite3, bcryptjs, React 18, Vite 5, React Router 6, Zustand (client state)

---

## Task 1: Initialize Project Structure + Git

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Initialize root package.json**

```bash
cd /Users/christophervance/projects/map_dnd
npm init -y
```

**Step 2: Update root package.json with workspace scripts**

Replace `package.json` with:

```json
{
  "name": "cartowl",
  "version": "1.0.0",
  "description": "D&D map purchasing app — owl cartographers sell geography",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "cd server && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 3: Install root dev deps**

```bash
npm install
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.db
*.db-shm
*.db-wal
.env
client/dist/
```

**Step 5: Initialize git and commit**

```bash
git init
git config user.name "YourBr0ther"
git config user.email "YourBr0ther.tv@gmail.com"
git add .
git commit -m "chore: initialize cartowl project"
```

---

## Task 2: Create GitHub Repository

**Step 1: Create repo on GitHub using gh CLI**

```bash
gh repo create YourBr0ther/cartowl \
  --public \
  --description "D&D map purchasing app — owl cartographers sell geography" \
  --source=. \
  --remote=origin \
  --push
```

Expected: Repo created at https://github.com/YourBr0ther/cartowl

---

## Task 3: Initialize Express Server

**Files:**
- Create: `server/package.json`
- Create: `server/index.js`
- Create: `server/.env.example`

**Step 1: Create server/package.json**

```json
{
  "name": "cartowl-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

**Step 2: Install server deps**

```bash
cd server && npm install
```

**Step 3: Create server/index.js**

```js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'cartowl' });
});

// Serve React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Cartowl server running on port ${PORT}`);
});

module.exports = app;
```

**Step 4: Create server/.env.example**

```
PORT=3001
ADMIN_TOKEN=change-this-secret-token
NODE_ENV=development
```

**Step 5: Test the health check**

```bash
cd server && node index.js &
curl http://localhost:3001/api/health
kill %1
```

Expected: `{"status":"ok","app":"cartowl"}`

**Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "feat: add express server with health check"
```

---

## Task 4: SQLite Database Schema

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/database.js`

**Step 1: Create server/db/ directory**

```bash
mkdir -p server/db
```

**Step 2: Create server/db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  is_unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at DATETIME,
  UNIQUE(x, y, width, height)
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  message TEXT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  gold_cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  gold_balance INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS legend_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('gold_costs', '{"1x1": 10, "2x2": 35, "3x3": 75, "1x3": 25}'),
  ('admin_password_hash', '');
```

**Step 3: Create server/db/database.js**

```js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../cartowl.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    // Run schema migrations
    db.exec(schema);
  }
  return db;
}

module.exports = { getDb };
```

**Step 4: Write a test for database initialization**

Create `server/db/database.test.js`:

```js
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
```

**Step 5: Run the test**

```bash
cd server && npx jest db/database.test.js --no-coverage
```

Expected: 3 passing

**Step 6: Commit**

```bash
cd ..
git add server/db/
git commit -m "feat: add SQLite schema and database module"
```

---

## Task 5: Admin Auth Middleware + Login Route

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/routes/admin-auth.js`
- Create: `server/routes/admin-auth.test.js`

**Step 1: Create server/middleware/auth.js**

```js
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'cartowl-dev-token';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { requireAdmin };
```

**Step 2: Create server/routes/admin-auth.js**

```js
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
```

**Step 3: Register route in server/index.js**

Add after the health check route:

```js
const adminAuthRouter = require('./routes/admin-auth');
app.use('/api/admin', adminAuthRouter);
```

**Step 4: Write failing test**

Create `server/routes/admin-auth.test.js`:

```js
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
```

**Step 5: Run tests**

```bash
cd server && npx jest routes/admin-auth.test.js --no-coverage
```

Expected: 2 passing

**Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "feat: add admin auth login and middleware"
```

---

## Task 6: Public API Routes (sections, legend, requests)

**Files:**
- Create: `server/routes/public.js`
- Create: `server/routes/public.test.js`

**Step 1: Write failing test**

Create `server/routes/public.test.js`:

```js
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
    db.prepare("INSERT INTO legend_entries (symbol,label) VALUES ('🌲','Forest')").run();
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
```

**Step 2: Run to verify failure**

```bash
cd server && npx jest routes/public.test.js --no-coverage
```

Expected: FAIL — routes not found

**Step 3: Create server/routes/public.js**

```js
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
```

**Step 4: Register in server/index.js**

```js
const publicRouter = require('./routes/public');
app.use('/api', publicRouter);
```

**Step 5: Run tests**

```bash
cd server && npx jest routes/public.test.js --no-coverage
```

Expected: 4 passing

**Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "feat: add public API routes (sections, legend, requests)"
```

---

## Task 7: Admin API Routes (requests, sections, players, legend)

**Files:**
- Create: `server/routes/admin.js`
- Create: `server/routes/admin.test.js`

**Step 1: Write failing tests**

Create `server/routes/admin.test.js`:

```js
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
      .send({ symbol: '🏔️', label: 'Mountain', description: 'Snowy peaks' });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Mountain');
  });
  test('deletes a legend entry', async () => {
    const db = getDb();
    const e = db.prepare("INSERT INTO legend_entries (symbol,label) VALUES ('🌊','Ocean')").run();
    const res = await request(app).delete(`/api/admin/legend/${e.lastInsertRowid}`).set(auth);
    expect(res.status).toBe(204);
  });
});
```

**Step 2: Run to verify failure**

```bash
cd server && npx jest routes/admin.test.js --no-coverage
```

**Step 3: Create server/routes/admin.js**

```js
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
```

**Step 4: Register in server/index.js**

```js
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);
```

**Step 5: Run all server tests**

```bash
cd server && npx jest --no-coverage
```

Expected: All passing

**Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "feat: add complete admin API (requests, sections, players, legend)"
```

---

## Task 8: Admin Password Setup Script

**Files:**
- Create: `server/scripts/set-password.js`

**Step 1: Create directory and script**

```bash
mkdir -p server/scripts
```

Create `server/scripts/set-password.js`:

```js
// Usage: node server/scripts/set-password.js <newpassword>
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node set-password.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const db = getDb();
db.prepare("UPDATE settings SET value=? WHERE key='admin_password_hash'").run(hash);
console.log('Admin password updated successfully.');
process.exit(0);
```

**Step 2: Test it**

```bash
cd server && node scripts/set-password.js owlsarewise
```

Expected: "Admin password updated successfully."

**Step 3: Commit**

```bash
cd ..
git add server/scripts/
git commit -m "chore: add admin password setup script"
```

---

## Task 9: Initialize React + Vite Client

**Step 1: Scaffold the client**

```bash
npm create vite@latest client -- --template react
cd client && npm install
npm install react-router-dom zustand
```

**Step 2: Update client/vite.config.js to proxy API in dev**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

**Step 3: Replace client/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MapView from './pages/MapView'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/AdminLogin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 4: Create stub pages**

```
client/src/pages/MapView.jsx       — export default function MapView() { return <div>Map</div> }
client/src/pages/AdminLogin.jsx    — export default function AdminLogin() { return <div>Login</div> }
client/src/pages/AdminPanel.jsx    — export default function AdminPanel() { return <div>Admin</div> }
```

**Step 5: Run dev to verify it starts**

```bash
cd client && npm run dev
```

Open http://localhost:5173 — should show "Map". Ctrl+C to stop.

**Step 6: Commit**

```bash
cd ..
git add client/
git commit -m "feat: scaffold React + Vite client with routing"
```

---

## Task 10: Global Styles — Owl/Cartography Theme

**Files:**
- Modify: `client/src/index.css`

**Step 1: Replace client/src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --parchment: #F5E6C8;
  --parchment-dark: #E8D5A8;
  --ink: #2C1A0E;
  --ink-light: #4A2E1A;
  --forest: #2D4A22;
  --sienna: #8B4513;
  --moonlight: #C8D8E8;
  --fog: #1A1008;
  --fog-mid: #2A1E10;
  --gold: #C8922A;
  --gold-light: #E8B84A;
  --font-display: 'Cinzel', serif;
  --font-body: 'Crimson Text', serif;
  --shadow-parchment: 2px 2px 8px rgba(44, 26, 14, 0.4);
  --shadow-deep: 4px 4px 16px rgba(0, 0, 0, 0.6);
}

html, body, #root { height: 100%; width: 100%; overflow: hidden; background: var(--fog); color: var(--parchment); font-family: var(--font-body); font-size: 16px; }

button { cursor: pointer; font-family: var(--font-display); }
input, textarea { font-family: var(--font-body); }
```

**Step 2: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add owl/cartography color theme and typography"
```

---

## Task 11: Zustand Stores

**Files:**
- Create: `client/src/store/mapStore.js`
- Create: `client/src/store/adminStore.js`

**Step 1: Create client/src/store/mapStore.js**

```js
import { create } from 'zustand'

export const useMapStore = create((set) => ({
  sections: [],
  legend: [],
  isLegendOpen: false,
  selectedCell: null,

  fetchSections: async () => {
    const res = await fetch('/api/sections')
    set({ sections: await res.json() })
  },
  fetchLegend: async () => {
    const res = await fetch('/api/legend')
    set({ legend: await res.json() })
  },
  toggleLegend: () => set((s) => ({ isLegendOpen: !s.isLegendOpen })),
  selectCell: (cell) => set({ selectedCell: cell }),
  clearSelection: () => set({ selectedCell: null }),
}))
```

**Step 2: Create client/src/store/adminStore.js**

```js
import { create } from 'zustand'

export const useAdminStore = create((set, get) => ({
  token: localStorage.getItem('cartowl_admin_token') || null,
  requests: [],
  players: [],
  legend: [],

  login: async (password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) throw new Error('Invalid password')
    const { token } = await res.json()
    localStorage.setItem('cartowl_admin_token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('cartowl_admin_token')
    set({ token: null })
  },

  authHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${get().token}`,
  }),

  fetchRequests: async () => {
    const res = await fetch('/api/admin/requests', { headers: get().authHeaders() })
    set({ requests: await res.json() })
  },

  approveRequest: async (id) => {
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ action: 'approve' }),
    })
    get().fetchRequests()
  },

  rejectRequest: async (id) => {
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ action: 'reject' }),
    })
    get().fetchRequests()
  },

  fetchPlayers: async () => {
    const res = await fetch('/api/admin/players', { headers: get().authHeaders() })
    set({ players: await res.json() })
  },

  createPlayer: async (name, gold_balance) => {
    await fetch('/api/admin/players', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify({ name, gold_balance }),
    })
    get().fetchPlayers()
  },

  updatePlayerGold: async (id, gold_balance) => {
    await fetch(`/api/admin/players/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ gold_balance }),
    })
    get().fetchPlayers()
  },

  fetchLegend: async () => {
    const res = await fetch('/api/admin/legend', { headers: get().authHeaders() })
    set({ legend: await res.json() })
  },

  createLegendEntry: async (entry) => {
    await fetch('/api/admin/legend', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify(entry),
    })
    get().fetchLegend()
  },

  deleteLegendEntry: async (id) => {
    await fetch(`/api/admin/legend/${id}`, {
      method: 'DELETE', headers: get().authHeaders(),
    })
    get().fetchLegend()
  },

  unlockSection: async (x, y, width, height) => {
    await fetch('/api/admin/sections', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify({ x, y, width, height }),
    })
  },
}))
```

**Step 3: Commit**

```bash
git add client/src/store/
git commit -m "feat: add Zustand stores for map and admin state"
```

---

## Task 12: MapCanvas Component (Pan + Zoom + Fog)

**Files:**
- Create: `client/src/components/MapCanvas.jsx`
- Create: `client/src/components/MapCanvas.css`

**Step 1: Create client/src/components/MapCanvas.jsx**

See full implementation in design doc. Key features:
- Mouse drag for pan (onMouseDown/Move/Up)
- Scroll wheel for zoom toward cursor
- Touch events for pinch-to-zoom
- CSS transform on `map-world` div: `translate(x,y) scale(s)`
- Grid clicks converted from screen → world → cell coordinates
- `FogLayer` component renders locked cells as dark overlays
- Unlocked sections render as transparent with gold border

Implementation:

```jsx
import { useRef, useState, useCallback, useEffect } from 'react'
import './MapCanvas.css'

const CELL_SIZE = 64
const MIN_ZOOM = 0.3
const MAX_ZOOM = 3

export default function MapCanvas({ sections, onCellClick, children }) {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const dragRef = useRef(null)
  const lastTouchRef = useRef(null)

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    dragRef.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y }
  }, [transform])

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current) return
    setTransform((t) => ({ ...t, x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY }))
  }, [])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => {
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.scale * delta))
      const rect = containerRef.current.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      return { x: cx - (cx - t.x) * (newScale / t.scale), y: cy - (cy - t.y) * (newScale / t.scale), scale: newScale }
    })
  }, [])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0].clientX - transform.x, startY: e.touches[0].clientY - transform.y }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchRef.current = { dist: Math.hypot(dx, dy), scale: transform.scale }
    }
  }, [transform])

  const onTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragRef.current) {
      setTransform((t) => ({ ...t, x: e.touches[0].clientX - dragRef.current.startX, y: e.touches[0].clientY - dragRef.current.startY }))
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, lastTouchRef.current.scale * (Math.hypot(dx, dy) / lastTouchRef.current.dist)))
      setTransform((t) => ({ ...t, scale: newScale }))
    }
  }, [])

  const onTouchEnd = useCallback(() => { dragRef.current = null; lastTouchRef.current = null }, [])

  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchmove', onTouchMove) }
  }, [onWheel, onTouchMove])

  const handleClick = useCallback((e) => {
    if (dragRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const worldX = (e.clientX - rect.left - transform.x) / transform.scale
    const worldY = (e.clientY - rect.top - transform.y) / transform.scale
    onCellClick?.({ x: Math.floor(worldX / CELL_SIZE), y: Math.floor(worldY / CELL_SIZE) })
  }, [transform, onCellClick])

  return (
    <div className="map-container" ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onClick={handleClick}>
      <div className="map-world" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
        <div className="map-image-layer" />
        {sections.map((s) => (
          <div key={`${s.x}-${s.y}`} className="section-unlocked"
            style={{ left: s.x * CELL_SIZE, top: s.y * CELL_SIZE, width: s.width * CELL_SIZE, height: s.height * CELL_SIZE }} />
        ))}
        <FogLayer sections={sections} cellSize={CELL_SIZE} />
        {children}
      </div>
    </div>
  )
}

function FogLayer({ sections, cellSize }) {
  const GRID_EXTENT = 50
  const unlockedSet = new Set(sections.flatMap((s) => {
    const cells = []
    for (let dx = 0; dx < s.width; dx++)
      for (let dy = 0; dy < s.height; dy++)
        cells.push(`${s.x + dx},${s.y + dy}`)
    return cells
  }))

  const cells = []
  for (let x = -5; x < GRID_EXTENT; x++)
    for (let y = -5; y < GRID_EXTENT; y++)
      if (!unlockedSet.has(`${x},${y}`))
        cells.push(<div key={`fog-${x}-${y}`} className="fog-cell"
          style={{ left: x * cellSize, top: y * cellSize, width: cellSize, height: cellSize }} />)
  return <>{cells}</>
}
```

**Step 2: Create client/src/components/MapCanvas.css**

```css
.map-container { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--fog); cursor: grab; user-select: none; }
.map-container:active { cursor: grabbing; }
.map-world { position: absolute; transform-origin: 0 0; will-change: transform; }
.map-image-layer {
  position: absolute; inset: 0; background-color: var(--fog-mid);
  background-image: linear-gradient(rgba(200,146,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,146,42,0.05) 1px, transparent 1px);
  background-size: 64px 64px; width: 3200px; height: 3200px;
}
.section-unlocked { position: absolute; background: transparent; border: 1px solid rgba(200,146,42,0.3); z-index: 1; pointer-events: none; }
.fog-cell { position: absolute; background: var(--fog); border: 1px solid rgba(200,146,42,0.08); z-index: 2; animation: fogShimmer 4s ease-in-out infinite; }
@keyframes fogShimmer { 0%, 100% { opacity: 0.92; } 50% { opacity: 1; } }
```

**Step 3: Commit**

```bash
git add client/src/components/
git commit -m "feat: add MapCanvas with pan, zoom, and fog of war"
```

---

## Task 13: RequestModal + LegendPanel Components

**Files:**
- Create: `client/src/components/RequestModal.jsx`
- Create: `client/src/components/RequestModal.css`
- Create: `client/src/components/LegendPanel.jsx`
- Create: `client/src/components/LegendPanel.css`

**Step 1: Create RequestModal.jsx**

Features:
- Shows grid position
- Size selector: 1×1 (10🪙), 2×2 (35🪙), 3×3 (75🪙), 1×3 (25🪙)
- Player name input (required)
- Message textarea
- Submit → POST /api/requests
- Success confirmation state

**Step 2: Create LegendPanel.jsx**

Features:
- Fixed bottom-right toggle button ("🗺️ Key")
- Slide-in drawer from right
- Lists all legend entries with symbol, label, description
- Parchment scroll aesthetic with "— Cartowl Survey Co. —" footer

(See full CSS and JSX content in design doc. Follow the owl/parchment color palette from Task 10.)

**Step 3: Commit**

```bash
git add client/src/components/
git commit -m "feat: add RequestModal and LegendPanel components"
```

---

## Task 14: Player MapView Page (complete)

**Files:**
- Modify: `client/src/pages/MapView.jsx`
- Create: `client/src/pages/MapView.css`

**Step 1: Replace MapView.jsx**

```jsx
import { useEffect } from 'react'
import { useMapStore } from '../store/mapStore'
import MapCanvas from '../components/MapCanvas'
import RequestModal from '../components/RequestModal'
import LegendPanel from '../components/LegendPanel'
import './MapView.css'

export default function MapView() {
  const { sections, legend, isLegendOpen, selectedCell, fetchSections, fetchLegend, toggleLegend, selectCell, clearSelection } = useMapStore()

  useEffect(() => { fetchSections(); fetchLegend() }, [])

  function handleCellClick(cell) {
    const isUnlocked = sections.some((s) =>
      cell.x >= s.x && cell.x < s.x + s.width && cell.y >= s.y && cell.y < s.y + s.height
    )
    if (!isUnlocked) selectCell(cell)
  }

  return (
    <div className="map-view">
      <header className="map-header">
        <div className="map-title">
          <span className="header-owl">🦉</span>
          <span className="header-name">Cartowl</span>
        </div>
        <p className="map-subtitle">Survey Co. — Charting the Known World</p>
      </header>
      <MapCanvas sections={sections} onCellClick={handleCellClick} />
      <LegendPanel entries={legend} isOpen={isLegendOpen} onToggle={toggleLegend} />
      {selectedCell && <RequestModal cell={selectedCell} onClose={clearSelection} />}
    </div>
  )
}
```

**Step 2: Create MapView.css**

```css
.map-view { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
.map-header {
  position: absolute; top: 0; left: 0; right: 0; z-index: 40; display: flex; flex-direction: column;
  align-items: center; padding: 0.75rem;
  background: linear-gradient(to bottom, rgba(26,16,8,0.9) 0%, transparent 100%);
  pointer-events: none;
}
.map-title { display: flex; align-items: center; gap: 0.5rem; }
.header-owl { font-size: 1.5rem; }
.header-name { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; color: var(--gold-light); letter-spacing: 0.1em; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
.map-subtitle { font-family: var(--font-body); font-size: 0.75rem; font-style: italic; color: var(--parchment); opacity: 0.7; letter-spacing: 0.05em; }
```

**Step 3: Commit**

```bash
git add client/src/pages/
git commit -m "feat: complete player MapView page"
```

---

## Task 15: Admin Login Page

**Files:**
- Modify: `client/src/pages/AdminLogin.jsx`
- Create: `client/src/pages/AdminLogin.css`

**Step 1: Replace AdminLogin.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import './AdminLogin.css'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAdminStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(password)
      navigate('/admin')
    } catch {
      setError('Invalid password. The owls are watching.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-owl">🦉</div>
        <h1>Cartowl</h1>
        <p className="login-subtitle">Cartographer's Guild — Staff Only</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Guild password..." required autoFocus />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Consulting the owls...' : 'Enter Guild'}
          </button>
        </form>
        <a href="/" className="login-back">← Return to the Map</a>
      </div>
    </div>
  )
}
```

**Step 2: Create AdminLogin.css** — parchment box on dark background, centered, owl icon, Cinzel font.

**Step 3: Commit**

```bash
git add client/src/pages/AdminLogin.*
git commit -m "feat: add admin login page"
```

---

## Task 16: Admin Panel — Full Implementation

**Files:**
- Modify: `client/src/pages/AdminPanel.jsx`
- Create: `client/src/pages/AdminPanel.css`
- Create: `client/src/components/admin/RequestsTab.jsx`
- Create: `client/src/components/admin/PlayersTab.jsx`
- Create: `client/src/components/admin/LegendTab.jsx`
- Create: `client/src/components/admin/AdminMapTab.jsx`

**Step 1: Create RequestsTab.jsx**

Features: Lists pending requests with player name, section size, coords, gold cost, message. Approve/reject buttons. Shows resolved requests below.

**Step 2: Create PlayersTab.jsx**

Features: Form to add player (name + starting gold). Lists players with editable gold balance.

**Step 3: Create LegendTab.jsx**

Features: Form to add entry (symbol + label + description). Lists entries with delete button.

**Step 4: Create AdminMapTab.jsx**

Features: Form with x, y, size selector to directly unlock a section. Shows success message.

**Step 5: Replace AdminPanel.jsx**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import RequestsTab from '../components/admin/RequestsTab'
import PlayersTab from '../components/admin/PlayersTab'
import LegendTab from '../components/admin/LegendTab'
import AdminMapTab from '../components/admin/AdminMapTab'
import './AdminPanel.css'

const TABS = ['Requests', 'Map', 'Players', 'Legend']

export default function AdminPanel() {
  const { token, logout } = useAdminStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Requests')

  useEffect(() => { if (!token) navigate('/admin/login') }, [token])
  if (!token) return null

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-title">🦉 Cartowl Guild — Admin</div>
        <nav className="admin-tabs">
          {TABS.map((t) => <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
        </nav>
        <div className="admin-actions">
          <a href="/" className="admin-link">View Map</a>
          <button onClick={logout} className="admin-logout">Logout</button>
        </div>
      </header>
      <main className="admin-main">
        {activeTab === 'Requests' && <RequestsTab />}
        {activeTab === 'Map' && <AdminMapTab />}
        {activeTab === 'Players' && <PlayersTab />}
        {activeTab === 'Legend' && <LegendTab />}
      </main>
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: complete admin panel with all four tabs"
```

---

## Task 17: Smoke Test + Bug Fix

**Step 1: Start both services**

```bash
# Terminal 1
cd server && node index.js

# Terminal 2
cd client && npm run dev
```

**Step 2: Set admin password**

```bash
cd server && node scripts/set-password.js owlsarewise
```

**Step 3: Player flow**

1. Open http://localhost:5173
2. Verify fog-of-war grid renders on dark background
3. Verify "Cartowl" header with owl icon at top
4. Drag to pan — map should move
5. Scroll to zoom — should zoom toward cursor
6. Click a fog cell → request modal appears
7. Fill in name, select 2×2, add message, submit
8. Verify success confirmation appears

**Step 4: Admin flow**

1. Open http://localhost:5173/admin/login
2. Enter wrong password — should show "The owls are watching" error
3. Enter "owlsarewise" — redirects to /admin
4. Requests tab: see submitted request
5. Click Approve — request moves to Resolved
6. Open http://localhost:5173 — verify section is now unlocked (fog removed)
7. Players tab: add "Thorn" with 100 gold
8. Legend tab: add "🌲 Forest — Dense ancient woodland"
9. Return to player map — verify legend shows in drawer

**Step 5: Fix any issues, then commit**

```bash
git add .
git commit -m "fix: smoke test corrections"
git push
```

---

## Task 18: README

**Files:**
- Modify: `README.md`

**Step 1: Update README.md**

```markdown
# Cartowl

D&D map purchasing app — owl cartographers sell geography to adventurers.

Players visit the shared map, see what has been unlocked, and request new sections. The DM approves or rejects requests from the admin panel, managing player gold and directly revealing sections as the story unfolds.

## Setup

### Prerequisites
- Node.js 20+

### Install

```bash
npm install
cd server && npm install
cd ../client && npm install && cd ..
```

### Set Admin Password

```bash
node server/scripts/set-password.js <yourpassword>
```

### Development

```bash
npm run dev
```

- Player map: http://localhost:5173
- Admin panel: http://localhost:5173/admin/login

### Production Build

```bash
npm run build   # compiles React to client/dist/
npm start       # Express serves API + static on port 3001
```

## Tech Stack

- React 18 + Vite + Zustand
- Node.js + Express 4
- SQLite (better-sqlite3)
```

**Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add README"
git push
```
