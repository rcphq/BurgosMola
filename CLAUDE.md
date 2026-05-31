# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory workflow

After every change, run in order:
1. `npm run lint` — must pass clean
2. `npm run typecheck` — must pass clean
3. `npm test` — must pass
4. Verify the actual behavior matches the goal (start `npm run dev`, exercise the affected path manually or via curl). Do not declare success based solely on passing tests — tests may not cover the changed behavior.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run lint         # ESLint (next/core-web-vitals)
npm run typecheck    # tsc --noEmit
npm test             # vitest run (all tests)
npm run test:watch   # vitest watch mode

# single test file
npx vitest run src/lib/events/schema.test.ts

# DB
npm run db:migrate   # apply pending migrations
npm run db:push      # push schema directly (no migration file)
npm run db:studio    # Drizzle Studio UI

# data
npm run ingest:files            # load data/events/*.json into DB
npm run validate data/events/x.json  # validate JSON without DB
```

Required env vars (see `.env.example`): `DATABASE_URL`, `INGEST_TOKEN`, `NEXT_PUBLIC_BASE_URL`, `DEFAULT_TIMEZONE`, `DEFAULT_CITY`.

## Architecture

**Data flow:**
```
JSON sources (data/events/*.json or POST /api/ingest)
  → Zod validate (src/lib/events/schema.ts)
  → dedupeKey lookup + fuzzy match (src/lib/events/dedupe.ts)
  → upsert/merge into Neon Postgres (src/lib/events/ingest.ts)
  → serve via Next.js server components + API routes
```

**Layers:**

| Layer | Path | Role |
|---|---|---|
| DB schema | `src/lib/db/schema.ts` | Drizzle ORM: `events` + `event_sources` tables |
| Event validation | `src/lib/events/schema.ts` | Zod — canonical event shape; source of truth for all event types |
| Ingestion pipeline | `src/lib/events/ingest.ts` | Orchestrates validate → dedupe → upsert |
| Deduplication | `src/lib/events/dedupe.ts` | Deterministic key first; falls back to Dice bigram similarity ≥ 0.82 on same calendar day |
| Queries | `src/lib/events/queries.ts` | `getUpcomingEvents()` with category/date filters; `groupByDay()` |
| ICS generation | `src/lib/events/ics.ts` | RFC 5545 output + Google/Outlook calendar URLs |
| Categories | `src/lib/categories.ts` | 8 canonical categories, alias map (lowercase → canonical), Tailwind color map |
| API routes | `src/app/api/` | `POST /api/ingest` (bearer token), `GET /api/calendar.ics`, `GET /api/events/[id]/ics` |
| UI | `src/app/page.tsx` | Server component; filter state lives in URL search params (`?category=X&date=Y`) |

**Key invariants:**
- `dedupeKey` = normalized title + date + venue — must remain stable; changing it creates duplicates
- `event_sources` tracks raw provenance per `(source, sourceUid)` unique pair; one canonical event can have multiple sources
- `page.tsx` is `force-dynamic` — no caching, always reads live DB
- Client components (`FilterBar`, `ShareButtons`) use `useRouter`/`useSearchParams` for filter state; no global state library
- Category aliases normalize at ingest time; always use canonical names from `src/lib/categories.ts` in new code

**Adding a new category:** update the enum in `src/lib/categories.ts`, add aliases and a Tailwind color, then run `npm run schema:gen` to regenerate `schemas/event.schema.json`.

**Schema changes:** prefer `db:generate` + `db:migrate` over `db:push` in any environment that has real data.
