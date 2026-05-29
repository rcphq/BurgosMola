# Burgos Event Hub

Consolidate events from many sources (websites, Instagram, manual finds, AI) into
a single, de-duplicated, calendar-friendly guide to what's happening in Burgos.

- **Stack:** Next.js 15 (App Router, React 19) · TypeScript · Drizzle ORM ·
  Neon (serverless Postgres) · Tailwind CSS · deploy on Vercel.
- **Ingestion:** one canonical event format funnels through a single
  validate → fuzzy-dedupe → upsert pipeline, used by both a JSON-file loader and
  an authenticated API endpoint.
- **Calendar:** every event has Google/Outlook "add to calendar" links and an
  `.ics` download, plus a subscribable feed at `/api/calendar.ics`.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local
#   - DATABASE_URL : your Neon connection string
#   - INGEST_TOKEN : openssl rand -hex 32

# 3. Create the schema in your database
npm run db:push

# 4. Load the example event(s) from data/events/
npm run ingest:files

# 5. Run it
npm run dev   # http://localhost:3000
```

Before the database is configured the site still boots and shows a setup notice
instead of crashing.

## Adding events

Two paths, same pipeline (see [`docs/INGESTION.md`](docs/INGESTION.md)):

1. **Commit a JSON file** to `data/events/` (great from your phone via GitHub
   mobile). It's ingested by `npm run ingest:files`, which also runs on deploy.
2. **POST to `/api/ingest`** with your `INGEST_TOKEN` for instant, no-commit
   drops (phone shortcut, curl, an AI agent).

The event format is documented in [`docs/EVENT_FORMAT.md`](docs/EVENT_FORMAT.md);
only `title` and `startsAt` are required.

## Documentation

| Doc | What's in it |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the pieces fit; data model; dedupe strategy; deploy notes. |
| [`docs/EVENT_FORMAT.md`](docs/EVENT_FORMAT.md) | The canonical event JSON, field by field (incl. multi-source). |
| [`docs/AI_AUTHORING_GUIDE.md`](docs/AI_AUTHORING_GUIDE.md) | Copy-paste prompt + rules for generating events in another AI session. |
| [`docs/INGESTION.md`](docs/INGESTION.md) | The two ingestion paths and how to use them. |
| [`docs/SCRAPERS.md`](docs/SCRAPERS.md) | Plan for scraping (Cloudflare/Instagram) — the follow-up phase. |

The machine-readable contract is [`schemas/event.schema.json`](schemas/event.schema.json)
(JSON Schema). Validate files with `npm run validate`.

## npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | Next.js ESLint. |
| `npm run db:push` | Apply the schema to your database (no migration files). |
| `npm run db:generate` / `db:migrate` | Generate & run SQL migrations (for prod). |
| `npm run db:studio` | Drizzle Studio (browse the DB). |
| `npm run ingest:files` | Ingest every JSON file under `data/events/`. |
| `npm run validate [files]` | Validate event JSON against the schema (no DB). |
| `npm run schema:gen` | Regenerate `schemas/event.schema.json` from the Zod schema. |
