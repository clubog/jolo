# JOLO MVP — Personalized Event Scheduling (Berlin)

A Next.js app that generates personalized day-by-day event schedules for Berlin, Feb 16–22, 2026. Designed for 15-minute usability test sessions.

## Tech Stack

- **Framework:** Next.js 15 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (PostCSS plugin)
- **Database:** SQLite via Prisma (zero-config local)
- **Testing:** Vitest
- **Port:** 3200

## Quick Start

```bash
cd jolo/mvp
pnpm install
pnpm db:push        # Create SQLite DB + tables
pnpm db:seed        # Seed 35 demo events
pnpm dev            # http://localhost:3200
pnpm test           # 54 unit + integration tests
```

To load real events: `npx tsx scripts/import-csv.ts /path/to/events.csv`
Then remap dates: `npx tsx scripts/remap-dates.ts`

Reset DB: `pnpm db:reset`

## Project Structure

```
mvp/
├── prisma/
│   ├── schema.prisma        # 2 models: Event, Feedback (session-based)
│   └── seed.ts              # 35 Berlin events (Feb 16–22)
├── scripts/
│   ├── import-csv.ts        # Import events from The Next Day CSV
│   └── remap-dates.ts       # Remap all events to Feb 16–22, 2026
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── plan/page.tsx          # Plan Builder (main tester UI)
│   │   ├── admin/page.tsx         # JSON import + event table
│   │   └── api/
│   │       ├── plan/route.ts      # POST (generate schedule)
│   │       ├── feedback/route.ts  # GET (list) / POST (save/hide — upsert)
│   │       └── events/route.ts    # GET (list) / POST (create/bulk import)
│   └── lib/
│       ├── scoring.ts             # Ranking engine (filter → score → schedule → explain)
│       ├── persona-presets.ts     # 4 hardcoded personas + Custom fallback
│       ├── types.ts               # Shared TypeScript types
│       ├── db-helpers.ts          # Prisma → domain type converter
│       └── prisma.ts              # Singleton Prisma client
└── __tests__/
    ├── scoring.test.ts      # 46 unit tests for scoring functions
    └── api-plan.test.ts     # 8 integration tests for plan generation
```

## Session Model

- **Anonymous sessions:** `localStorage` stores a UUID (`jolo_session_id`)
- **All API calls** include `x-session-id` header
- **No auth, no user accounts** — each browser tab gets a unique session

## Data Model

### Event
Stored fields: `title`, `date` (YYYY-MM-DD), `startTime`/`endTime` (HH:MM, nullable), `district`, `venue`, `category` (tech|art|music|club|community|workshop|film|other), `subtags` (JSON array), `priceEurMin`/`Max`, `socialDensity` (0–1), `socialOpenness` (0–1), `energyLevel` (0–1), `crowdVector` (JSON: founders/investors/artists/tourists 0–1), `accessDifficulty` (0–1).

### Feedback
Session-based. One per session+event pair (`@@unique([sessionId, eventId])`). Action: `SAVE` | `HIDE`. Upserted on POST.

## Persona Presets

4 hardcoded presets in `src/lib/persona-presets.ts` + Custom fallback:
- **Founder / Builder** — tech + community focus, founder/investor crowd
- **Creative / Artist** — art + music + film, artist crowd
- **Culture Explorer** — broad cultural interests, budget €40, latest start 23:00
- **Nightlife / Party** — club + music, earliest start 16:00
- **Custom** — neutral profile, no preferences

## Scoring Algorithm

### Composite Score (mood dominates)
```
baseScore = 0.40 * state + 0.30 * identity + 0.15 * behavior + 0.10 * logistics + 0.05 * novelty
finalScore = applyMoodGuardrails(baseScore, event, session)
```

### Components

**State Match (0–1) — 40% weight:** Intent profile + energy + socialMode fit.
**Identity Match (0–1) — 30% weight:** Persona interests + crowd cosine similarity.
**Behavior Match (−1→1, normalized) — 15% weight:** Feedback-driven category/subtag boost/penalty.
**Logistics Match (0–1) — 10% weight:** District proximity.
**Novelty (0–1) — 5% weight:** Unseen categories boosted.

### Mood Guardrails (post-scoring)

**Recover + Low Energy** — hard demotions:
- Networking tags → ×0.15, density>0.7 → ×0.25, energy>0.7 → ×0.4, access>0.6 → ×0.5
- Boosts: calm art/film/music +0.12, low-key community +0.10, easy access +0.05

**Solo mode:** density>0.7 → ×0.6

### Schedule Building
- Hidden events: hard excluded (not in primary or optional)
- Recover+low: max 2 primary/day, hard block density>0.6, energy>0.7, networking tags
- Default: up to 3 primary, 3 optional per day
- 30-minute buffer for collision detection
- Optional events annotated with `timeConflict: true` when overlapping primary

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Import single or array of events |
| POST | `/api/plan` | Generate plan. Body: `{ personaKey, intent, energy, socialMode?, districtFocus?, budgetToday? }` |
| POST | `/api/feedback` | Save/hide event. Body: `{ event_id, action: "SAVE"\|"HIDE" }` |
| GET | `/api/feedback` | List session feedbacks |

All routes include try/catch error handling. Session identified via `x-session-id` header.

## UI Pages

- **/** — Landing with "Start Planning" CTA + Admin link
- **/plan** — Plan Builder: persona preset chips → mood (intent+energy+social) → 9 district chips → Generate. Results grouped by day with Save/Hide buttons, time conflict badges on optional events
- **/admin** — JSON textarea for bulk import + event table

## Key Patterns

- **SQLite for local dev:** No DB setup needed. File at `prisma/dev.db`.
- **JSON-in-string fields:** Prisma SQLite stores arrays/objects as serialized strings, parsed via `toEventData()`.
- **Deterministic scoring:** No randomness — same inputs always produce same output.
- **Feedback upsert:** One record per session+event pair, updated on re-submit.
- **Analytics:** JSON `console.log` for `plan_generated`, `event_saved`, `event_hidden`.

## Event Data

284 events imported from The Next Day newsletter CSV, remapped to Feb 16–22, 2026.
- Distribution: Thu–Sun heavy (52–80/day), Mon–Wed lighter (4–13/day)
- Categories: other 59, art 53, music 48, film 43, club 43, community 30, tech 5, workshop 3
- 108 events have null district (shown as "District TBD" in UI)

## Testing

```bash
pnpm test          # Run all 54 tests
pnpm test:watch    # Watch mode
```

- **46 unit tests** (`scoring.test.ts`): identity/state/behavior/logistics/novelty match, composite scoring, guardrails, filtering, schedule building, hidden event exclusion, time conflict annotation, recovery mode regression, district correctness, sorting
- **8 integration tests** (`api-plan.test.ts`): plan shape validation, recovery constraints, hidden exclusion, persona presets, persona-mode ranking, feedback effects
