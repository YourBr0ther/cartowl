# 🦉 Cartowl

> Owl cartographers chart the unknown world — and sell their maps to adventurers.

Cartowl is a D&D companion web app where players discover and purchase sections of a campaign map. Players submit requests (spending in-game gold) through the in-world Cartographer's Guild. The DM approves or rejects them from an admin panel, with full control over the map, player gold, and the legend.

## Features

**For Players**
- Full-screen interactive map with drag-to-pan and pinch/scroll-to-zoom
- Fog of war over undiscovered territory
- Click any locked region to submit a purchase request to the cartographers
- Collapsible map legend showing terrain symbols and descriptions

**For the DM (Admin)**
- Approve or reject player purchase requests
- Directly unlock any map section without a request
- Manage player gold balances
- Configure the map legend

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/YourBr0ther/cartowl.git
cd cartowl

npm install
cd server && npm install
cd ../client && npm install && cd ..
```

### Set Admin Password

```bash
node server/scripts/set-password.js yourpasswordhere
```

### Run in Development

```bash
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Player map view |
| http://localhost:5173/admin/login | DM admin panel |

### Production Build

```bash
npm run build   # compiles React → client/dist/
npm start       # Express serves API + static files on port 3001
```

## Environment Variables

Copy `server/.env.example` to `server/.env`:

```env
PORT=3001
ADMIN_TOKEN=change-this-to-a-secret-value
NODE_ENV=development
```

## Running Tests

```bash
cd server && npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Zustand |
| Backend | Node.js, Express 4 |
| Database | SQLite (better-sqlite3) |
| Auth | bcryptjs + bearer token |

## Map Configuration

The map is currently a placeholder grid. To use your own map image, set the `background-image` on `.map-image-layer` in `client/src/components/MapCanvas.css`:

```css
.map-image-layer {
  background-image: url('/your-map.png');
  background-size: cover;
  width: 3200px;  /* adjust to match your grid */
  height: 3200px;
}
```

Default cell size is **64px**. The grid origin `(0, 0)` is the top-left corner.

## Section Sizes & Gold Costs

| Size | Default Cost |
|------|-------------|
| 1×1  | 🪙 10 gold |
| 2×2  | 🪙 35 gold |
| 3×3  | 🪙 75 gold |
| 1×3  | 🪙 25 gold |

Gold costs are configurable from the `settings` table in the database.

---

*Made for the table. Built by owls.*
