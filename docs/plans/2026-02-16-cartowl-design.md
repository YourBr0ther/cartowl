# Cartowl — Design Document

**Date:** 2026-02-16
**Author:** YourBr0ther

---

## Overview

Cartowl is a D&D companion web app that lets players discover and purchase sections of a campaign map through in-world owl cartographers. Players submit purchase requests (spending in-game gold) and the DM approves/rejects them via an admin panel. The theme: owls fly the world gathering geography and sell their maps to adventurers.

---

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** SQLite (`better-sqlite3`)
- **Deployment target:** Single Docker container (docker-compose / k3s later)

---

## Architecture

Single-container approach: Express serves the REST API and, in production, serves the compiled React static bundle. In development, Vite dev server and Express run as separate processes via a root `package.json` workspace.

```
cartowl/
├── server/
│   ├── db/              # SQLite schema + seed
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth middleware
│   └── index.js         # Express entry point
├── client/
│   ├── src/
│   │   ├── components/  # Shared UI components
│   │   ├── pages/       # MapView, AdminPanel
│   │   └── main.jsx
│   └── vite.config.js
└── package.json         # Root scripts
```

---

## Data Model

### `sections`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| x | INTEGER | Grid coordinate |
| y | INTEGER | Grid coordinate |
| width | INTEGER | 1, 2, or 3 |
| height | INTEGER | 1, 2, or 3 |
| is_unlocked | BOOLEAN | Default false |
| unlocked_at | DATETIME | Nullable |

### `requests`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| player_name | TEXT | |
| message | TEXT | Note to the cartographer |
| x | INTEGER | Requested grid origin |
| y | INTEGER | Requested grid origin |
| width | INTEGER | Section size |
| height | INTEGER | Section size |
| gold_cost | INTEGER | Cost at time of request |
| status | TEXT | pending / approved / rejected |
| created_at | DATETIME | |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | |
| gold_balance | INTEGER | Admin-managed |

### `legend_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| symbol | TEXT | Emoji or short text |
| label | TEXT | Name (e.g. "Forest") |
| description | TEXT | Optional detail |

### `settings`
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | |
| value | TEXT | Admin password hash, etc. |

---

## Pages & Routes

### Player Map View (`/`)
- Full-screen immersive map
- Infinite pan (drag) + zoom (scroll/pinch) via CSS transforms
- Grid overlay on top of the map image
  - **Locked cells:** Dark fog-of-war with owl feather texture, subtle shimmer animation
  - **Unlocked cells:** Map image visible beneath
- Click a locked cell → Request modal
  - Choose section size: 1×1, 2×2, 3×3, 1×3
  - Enter player name
  - Write a message to the cartographer
  - Shows gold cost
  - Submit → creates a `request` record with status `pending`
- Collapsible legend drawer (owl-scroll aesthetic) showing all legend entries
- No login required — shared view for all players

### Admin Panel (`/admin`)
- Password-protected (bcrypt hash in `settings` table, session token in localStorage)
- Tab-based dashboard:
  1. **Requests** — Pending/all requests; approve (unlocks section, deducts gold) or reject
  2. **Map** — Full map view with direct unlock controls on any section
  3. **Players** — List players, edit gold balances, add/remove players
  4. **Legend** — CRUD for map key entries

---

## API

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sections | All unlocked sections |
| GET | /api/legend | All legend entries |
| POST | /api/requests | Submit a purchase request |

### Admin (Bearer token required)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/admin/login | Authenticate, returns token |
| GET | /api/admin/requests | All requests |
| PUT | /api/admin/requests/:id | Approve or reject |
| POST | /api/admin/sections | Directly unlock a section |
| GET | /api/admin/players | List players |
| POST | /api/admin/players | Create player |
| PUT | /api/admin/players/:id | Update gold balance |
| GET | /api/admin/legend | List legend entries |
| POST | /api/admin/legend | Add entry |
| PUT | /api/admin/legend/:id | Update entry |
| DELETE | /api/admin/legend/:id | Delete entry |

---

## Design Theme

- **Name:** Cartowl
- **Palette:** Deep parchment (#F5E6C8), aged ink (#2C1A0E), forest green (#2D4A22), burnt sienna (#8B4513), moonlight silver (#C8D8E8)
- **Typography:** Cinzel or IM Fell English (serif/fantasy) for headers; readable sans for body
- **Motifs:** Owl silhouette watermark on fog cells, feather texture on locked areas, scroll-style legend panel
- **Animations:** Subtle shimmer on fog cells, smooth map reveal when sections unlock

---

## Map Image

- Placeholder used during development
- Final map is a single large image (PNG/JPG) configured via an env variable or admin settings upload
- Grid coordinates map to pixel offsets based on a configurable `cellSize` (default: 64px)

---

## Future Considerations (out of scope for v1)

- Docker / docker-compose configuration
- k3s deployment manifests
- Map image upload via admin panel
- Multiple campaigns / maps
- Push notifications when requests are approved
