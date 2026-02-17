# JOLO — Berlin Day Planner

A mobile-first PWA that generates personalized day itineraries for Berlin based on mood, district, and available time.

## Architecture

Monorepo with pnpm workspace:
- **`client/`** — React 19 + Vite + Tailwind v4 + vite-plugin-pwa
- **`server/`** — Express 5 + TypeScript + PostgreSQL + Claude API

## Tech Stack

- **Runtime:** Node.js ≥ 20 (required for `--env-file` flag and Express 5)
- **Package manager:** pnpm (workspace at root)
- **Client:** React 19, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite` plugin), React Router, vite-plugin-pwa
- **Server:** Express 5, pg (node-postgres), Zod, @anthropic-ai/sdk
- **Database:** PostgreSQL 16
- **Deployment:** Vercel (client), Railway (server + Postgres)

## Local Development

```bash
# Start local PostgreSQL (Homebrew)
brew services start postgresql@16

# Install dependencies
pnpm install

# Run migrations and seed
pnpm --filter server run migrate
pnpm --filter server run seed

# Start both dev servers
pnpm --filter server run dev    # Express on :3001
pnpm --filter client run dev    # Vite on :5180
```

Client dev server proxies `/api` to `localhost:3001` (configured in `client/vite.config.ts`).

> **Note:** The local Vite dev server runs on port **5180**. The `CORS_ORIGIN` env var defaults to `http://localhost:5180` for local development — the production value is set separately in Railway.

## Environment Variables

Root `.env` file (loaded by server via `--env-file=../.env`):

| Variable | Description | Default / Notes |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Local: your local PG; Railway: auto-injected |
| `ANTHROPIC_API_KEY` | Claude API key | Use `sk-ant-placeholder` for mock mode |
| `ADMIN_PASSWORD` | Single password for admin panel | — |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5180` (local); set to Vercel URL in production |
| `COOKIE_SECRET` | HMAC secret for admin cookies | `dev-secret` (local only — use a real secret in production) |
| `PORT` | Server port | `3001` locally; Railway injects `8080` |
| `VITE_API_URL` | Backend URL used by client | Not needed locally (proxy handles it); set in Vercel for production |

## Key Patterns

### Database
- Migrations in `server/src/db/migrations/` as numbered SQL files
- Auto-run on server startup via `runMigrations()` in `index.ts`
- Migration runner tracks applied migrations in `_migrations` table
- Connection pool in `server/src/db/pool.ts`

### Itinerary Generation Flow
1. User submits mood (energy/social 1–5), date, time blocks, bezirke
2. `itinerary-service.ts` queries events with **progressive widening**:
   - mood ±1 in selected bezirke → mood ±2 → adjacent bezirke → all bezirke
3. Caps at 15 candidates, builds travel time map
4. Sends candidates + context to Claude API (`claude-client.ts`)
5. Claude returns JSON: greeting, stops (3–6 events), alternatives, closing
6. If `ANTHROPIC_API_KEY` starts with `sk-ant-placeholder`, mock fallback is used

### Rate Limiting
The `POST /api/itinerary/generate` endpoint is rate-limited to prevent abuse. Limits are enforced per IP via in-memory tracking on the server.

### Auth
- Admin login: `POST /api/admin/login` with password → HMAC-signed httpOnly cookie
- `requireAdmin` middleware protects mutation endpoints
- No user accounts — admin only

### PWA
The client uses `vite-plugin-pwa` for progressive web app support. A service worker is generated at build time, enabling add-to-homescreen and basic asset caching. The app is designed mobile-first but works on desktop.

### API Routes
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| POST | `/api/admin/seed` | Admin | Seed 100 events |
| GET | `/api/events` | No | List events (filterable) |
| GET | `/api/events/:id` | No | Single event |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Toggle is_active |
| POST | `/api/itinerary/generate` | Rate-limited | Generate itinerary |
| GET | `/api/bezirke` | No | List bezirke |
| GET | `/api/event-types` | No | List event types |
| GET | `/api/health` | No | Health check |

### Frontend Structure
- **No state management library** — React state + useReducer + minimal context
- `usePlannerForm` — useReducer for 3-step mood/time/district flow
- `useItinerary` — generation loading/result state
- `useAdminAuth` — admin context for protected routes
- Design tokens in `client/src/index.css`: primary #E85D3A, secondary #6B4C9A, accent #4A9B8E, bg #FFF8F0
- Font: Nunito (Google Fonts)

## Deployment

### Production URLs
- **Frontend:** Hosted on Vercel
- **Backend:** `https://jolo-production.up.railway.app`

### Railway (server)
- Dockerfile at `server/Dockerfile` (referenced from repo root by `railway.toml`)
- Binds to `0.0.0.0` on Railway's injected PORT (8080)
- Public domain port must match the injected PORT in Networking settings
- Migrations auto-run on startup. SQL files copied to `dist/db/migrations/` in Dockerfile (tsc doesn't copy .sql)

### Vercel (client)
- Root directory set to `client` in Vercel UI (not in vercel.json)
- `VITE_API_URL` env var points to Railway backend URL
- SPA rewrites in `vercel.json`

## Common Tasks

### Add a new migration
Create `server/src/db/migrations/NNN_description.sql`. It will auto-run on next server start (both locally and in production on next deploy).

### Add events to production
```bash
curl -c cookies.txt -X POST https://jolo-production.up.railway.app/api/admin/login \
  -H "Content-Type: application/json" -d '{"password":"YOUR_PASSWORD"}'
curl -b cookies.txt -X POST https://jolo-production.up.railway.app/api/admin/seed
```

### Test the API locally
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/events
curl http://localhost:3001/api/events?bezirk=Kreuzberg&date=2026-02-18
```

### Test itinerary generation locally
```bash
curl -X POST http://localhost:3001/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mood": { "energy": 4, "social": 3 },
    "date": "2026-02-18",
    "timeBlocks": [{ "start": "10:00", "end": "18:00" }],
    "bezirke": ["Kreuzberg", "Neukölln"]
  }'
```
