# Architecture

## Goals

1. **One place** to see events happening in/around Burgos.
2. **Many sources, no duplicates** — the same real-world event reported by a
   website, an Instagram post, and a manual find should appear once, with all
   sources merged.
3. **Dead-simple to add events** — from a scraper, a phone, or an AI, using one
   small JSON format.
4. **Calendar-first UX** — add to Google/Outlook, download `.ics`, or subscribe
   to a live feed.
5. **Deployable on Vercel** with minimal moving parts.

## High-level flow

```
                 ┌──────────────────────────────────────────────┐
 sources         │                 INGESTION                    │
 ───────         │                                              │
 websites ─┐     │   data/events/*.json ──► ingest:files ─┐     │
 instagram ─┼──► (produce canonical JSON)                 ├──►  validate (Zod)
 manual ───┤     │   POST /api/ingest ────────────────────┘     │      │
 ai ───────┘     │                                              │      ▼
                 └──────────────────────────────────────────────┘  fuzzy dedupe
                                                                       │
                                                                       ▼
                                                              upsert / merge
                                                                       │
                                              ┌────────────────────────┘
                                              ▼
                                     Neon Postgres
                                     (events + event_sources)
                                              │
                                              ▼
                              Next.js UI  +  /api/*.ics  +  add-to-calendar links
```

The crucial design choice: **scrapers are decoupled from the website.** They
just need to emit the canonical event JSON. They can run locally, in GitHub
Actions, or anywhere — they never run inside the Vercel request path. This keeps
the site simple and lets scraping use whatever heavy tooling (headless browsers,
proxies) it needs for Cloudflare/Instagram. See [`SCRAPERS.md`](SCRAPERS.md).

## Data model

Two tables (`src/lib/db/schema.ts`):

- **`events`** — the canonical, de-duplicated event. One row per real-world
  event. Holds the merged "best" view of all fields.
- **`event_sources`** — provenance. One row per (source, origin-item). Links
  back to an `events` row and stores the raw payload. This is what makes
  "merge sources for uniqueness" real: many `event_sources` → one `events`.

### De-duplication (`src/lib/events/dedupe.ts`)

Two layers:

1. **Deterministic `dedupeKey`** = `normalized-title | day | venue-slug`. The
   fast path: identical key ⇒ identical event. Stored as a unique index.
2. **Fuzzy fallback** = Sørensen–Dice bigram similarity over normalized titles,
   scoped to the same calendar day. If similarity ≥ `FUZZY_MERGE_THRESHOLD`
   (0.82) we treat it as the same event and merge. This catches cross-source
   wording differences ("Concierto X" vs "Concierto de X en directo").

Merging never destroys data: it fills empty fields from the incoming payload and
always records the new source row. Tune the threshold in `dedupe.ts`.

## Ingestion pipeline (`src/lib/events/ingest.ts`)

`ingestEvents(payload)` is the single entry point used by both the file loader
and the API route:

1. Validate with Zod (`eventBatchSchema`) — accepts one event or an array.
2. Build `dedupeKey`; look for an exact match.
3. If none, run the fuzzy matcher against same-day events.
4. Match found → merge fields + upsert the source row (`created`→`updated`/`merged`).
5. No match → insert a new canonical event + its source row (`created`).

Idempotent by design (`onConflictDoNothing` on `(source, source_uid)`), so
re-running file ingestion on every deploy is safe.

## Calendar output (`src/lib/events/ics.ts`)

- `buildICalendar()` — RFC 5545 `.ics` for one or many events.
- `googleCalendarUrl()` / `outlookCalendarUrl()` — prefilled "new event" links.
- Routes: `/api/events/[id]/ics` (single) and `/api/calendar.ics` (subscribable
  feed of everything upcoming).

## Deploying on Vercel

- Use Neon (directly, or via the **Vercel ↔ Neon integration**, which injects
  `DATABASE_URL`/`POSTGRES_URL` automatically). The app uses Neon's HTTP driver
  (`drizzle-orm/neon-http`), which is serverless-friendly — no connection
  pooling headaches. `getDatabaseUrl()` accepts whichever variable the
  integration set.
- Set `INGEST_TOKEN` (and optional `DEFAULT_*`) env vars in the Vercel project.
- **The deploy self-initializes.** Vercel runs the `vercel-build` script, which
  applies migrations (`scripts/migrate.ts`) and ingests `data/events/*.json`
  (`scripts/ingest-files.ts`) before `next build`. Both steps skip gracefully if
  no database URL is set, so they never break a build.
- ⚠️ Env var changes only take effect on the **next deploy** — redeploy after
  connecting the database.
- For local schema work: `npm run db:push` (quick) or `db:generate` + `migrate`.
