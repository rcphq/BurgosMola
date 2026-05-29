# Ingestion

Two ways to add events. Both run the exact same validate → fuzzy-dedupe → upsert
pipeline (`ingestEvents` in `src/lib/events/ingest.ts`), so they behave
identically and are safe to mix.

## 1. Committed JSON files (`data/events/*.json`)

Best for: adding an event from your phone when you spot one (GitHub mobile lets
you create a file in-app), and for version-controlled / reviewable additions.

1. Create a file under `data/events/`, e.g. `data/events/2026-06-21-concierto.json`.
2. Put a single event **or** an array of events in it (see
   [`EVENT_FORMAT.md`](EVENT_FORMAT.md)).
3. Ingest:
   ```bash
   npm run ingest:files
   ```

This reads every `*.json` file in the folder and ingests it. It's idempotent —
re-running merges sources instead of duplicating — so you can also wire it into
your Vercel build to auto-ingest on every deploy.

> Naming tip: prefix with the date (`YYYY-MM-DD-...`) so the folder stays sorted
> and readable. The filename itself isn't parsed.

## 2. Authenticated API (`POST /api/ingest`)

Best for: instant drops with no commit — a phone shortcut, a `curl`, or an AI
agent that found an event.

Auth uses the `INGEST_TOKEN` env var, sent as a bearer token or `x-ingest-token`
header.

```bash
curl -X POST "$BASE_URL/api/ingest" \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Concierto en el Teatro Principal",
    "startsAt": "2026-06-21T20:00:00+02:00",
    "venueName": "Teatro Principal",
    "source": "ai"
  }'
```

Response:

```json
{
  "ok": true,
  "count": 1,
  "results": [
    { "action": "created", "eventId": "…", "title": "Concierto en el Teatro Principal" }
  ]
}
```

`action` is one of:

- `created` — brand-new event.
- `updated` — exact `dedupeKey` match; existing event's gaps filled, source added.
- `merged` — fuzzy title match on the same day; merged into the existing event
  (`matchedBy: "fuzzy"`, with the `similarity` score).

### Status codes

| Code | Meaning |
| --- | --- |
| `200` | Ingested. |
| `400` | Body wasn't valid JSON. |
| `401` | Missing/incorrect token (also returned if `INGEST_TOKEN` is unset — fails closed). |
| `422` | Validation failed; `issues` contains the Zod errors. |
| `500` | Unexpected error. |

### iPhone Shortcut recipe

1. **Text** → the event JSON (or use "Ask for Input").
2. **Get Contents of URL** → `POST` to `https://<your-app>/api/ingest`,
   Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`,
   Request Body: the JSON text.
3. Share the result. Done — event is live.

## Which should I use?

Start with **committed files** (zero infra, works from the GitHub mobile app).
Once the API is set up with a token, the **API path** is faster and can fully
replace files if you prefer. They coexist with no conflict.
