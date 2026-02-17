# Cartowl — Claude Code Guide

## Project Overview

Cartowl is a D&D map purchasing web app. Owl cartographers gather geography and sell map sections to adventurers. Players submit purchase requests; the DM approves/rejects them via an admin panel.

## Stack

- **Frontend:** React 18 + Vite 5 + React Router 6 + Zustand
- **Backend:** Node.js + Express 4
- **Database:** SQLite via `better-sqlite3`
- **Auth:** bcryptjs password hash stored in `settings` table; bearer token in localStorage

## Project Structure

```
cartowl/
├── server/
│   ├── db/
│   │   ├── schema.sql       # SQLite schema + default settings
│   │   └── database.js      # getDb() singleton
│   ├── middleware/
│   │   └── auth.js          # requireAdmin middleware (Bearer token)
│   ├── routes/
│   │   ├── public.js        # GET /api/sections, /api/legend, POST /api/requests
│   │   ├── admin-auth.js    # POST /api/admin/login
│   │   └── admin.js         # All /api/admin/* routes (requires auth)
│   ├── scripts/
│   │   └── set-password.js  # node scripts/set-password.js <password>
│   └── index.js             # Express entry point
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapCanvas.jsx      # Infinite pan/zoom map with fog of war
│   │   │   ├── RequestModal.jsx   # Section purchase request form
│   │   │   ├── LegendPanel.jsx    # Collapsible map key drawer
│   │   │   └── admin/
│   │   │       ├── RequestsTab.jsx
│   │   │       ├── PlayersTab.jsx
│   │   │       ├── LegendTab.jsx
│   │   │       └── AdminMapTab.jsx
│   │   ├── pages/
│   │   │   ├── MapView.jsx        # / — public player view
│   │   │   ├── AdminLogin.jsx     # /admin/login
│   │   │   └── AdminPanel.jsx     # /admin — requires auth
│   │   ├── store/
│   │   │   ├── mapStore.js        # Zustand store for player map state
│   │   │   └── adminStore.js      # Zustand store for admin state + API calls
│   │   └── index.css              # Global theme (CSS variables, fonts)
│   └── vite.config.js             # Proxies /api → localhost:3001 in dev
├── docs/
│   └── plans/                     # Design + implementation plans
├── CLAUDE.md
└── README.md
```

## Development

```bash
# Install all deps
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Set admin password (required on first run)
node server/scripts/set-password.js <yourpassword>

# Run both dev servers
npm run dev
```

- Player map: http://localhost:5173
- Admin panel: http://localhost:5173/admin/login

## Environment

`server/.env.example` contains:
```
PORT=3001
ADMIN_TOKEN=change-this-secret-token
NODE_ENV=development
```

Copy to `server/.env` and set `ADMIN_TOKEN` to a strong secret.

## Running Tests

```bash
cd server && npm test
```

Tests use `process.env.DB_PATH = ':memory:'` — always set this at the top of test files before requiring the app.

## Key Conventions

- **No player auth** — the player map is a shared public view; no logins
- **Grid coordinates** — sections use `(x, y)` integer coords; cell size is 64px
- **Section sizes** — 1×1, 2×2, 3×3, 1×3 (width × height)
- **Gold costs** — stored as JSON in `settings` table under key `gold_costs`
- **Admin token** — a static bearer token (not JWT); set via `ADMIN_TOKEN` env var
- **Map image** — currently a placeholder grid; swap via `map-image-layer` CSS background

## Theme

Owl cartography. Colors defined as CSS variables in `client/src/index.css`:

| Variable | Value | Use |
|----------|-------|-----|
| `--parchment` | `#F5E6C8` | Backgrounds, modals |
| `--ink` | `#2C1A0E` | Text, dark surfaces |
| `--sienna` | `#8B4513` | Borders, accents |
| `--gold` | `#C8922A` | Gold costs, highlights |
| `--fog` | `#1A1008` | Locked map cells |
| `--forest` | `#2D4A22` | Approve buttons |

Fonts: **Cinzel** (display/headers) and **Crimson Text** (body) from Google Fonts.

## Future Work (out of scope for v1)

- Docker / docker-compose
- k3s deployment manifests
- Map image upload via admin panel
- Multiple campaigns / maps
