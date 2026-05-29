# Canonical event format

This is the single shape every event flows through, whether it comes from a
scraper, a committed JSON file, the API, or an AI. The source of truth is the
Zod schema in [`src/lib/events/schema.ts`](../src/lib/events/schema.ts).

**Only `title` and `startsAt` are required.** Everything else is optional — add
what you have, leave out what you don't.

## Minimal example

```json
{
  "title": "Concierto en el Teatro Principal",
  "startsAt": "2026-06-21T20:00:00+02:00"
}
```

## Full example

```json
{
  "title": "Concierto en el Teatro Principal",
  "description": "Descripción del evento.",
  "startsAt": "2026-06-21T20:00:00+02:00",
  "endsAt": "2026-06-21T22:00:00+02:00",
  "timezone": "Europe/Madrid",
  "allDay": false,
  "venueName": "Teatro Principal",
  "address": "Paseo del Espolón, s/n",
  "city": "Burgos",
  "lat": 42.3409,
  "lng": -3.7009,
  "category": "música",
  "tags": ["concierto", "indie"],
  "url": "https://example.com/evento",
  "imageUrl": "https://example.com/poster.jpg",
  "price": "12 €",
  "status": "confirmed",
  "sources": [
    {
      "name": "website:teatroprincipal",
      "url": "https://teatroprincipal.example.com/agenda/concierto",
      "uid": "concierto-2026-06-21"
    },
    {
      "name": "instagram",
      "url": "https://instagram.com/p/abc123",
      "uid": "abc123",
      "scrapedAt": "2026-05-29T10:00:00+02:00"
    }
  ]
}
```

## Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | ✅ | The event name. Drives dedupe. |
| `startsAt` | ISO 8601 datetime | ✅ | Include an offset (e.g. `+02:00`) or it's read in `timezone`. |
| `endsAt` | ISO 8601 datetime | | Defaults to +2h in `.ics` output if omitted. |
| `timezone` | IANA string | | Defaults to `Europe/Madrid`. |
| `allDay` | boolean | | |
| `description` | string | | |
| `venueName` | string | | Part of the dedupe key — helps separate same-title events. |
| `address` | string | | |
| `city` | string | | Defaults to `Burgos`. |
| `lat` / `lng` | number | | For future maps. |
| `category` | string | | Free text (e.g. `música`, `teatro`, `deporte`). |
| `tags` | string[] | | |
| `url` | URL | | Canonical event link. |
| `imageUrl` | URL | | Poster/flyer. |
| `price` | string | | Free text (`"12 €"`, `"Gratis"`). |
| `status` | `confirmed` \| `tentative` \| `cancelled` | | Defaults to `confirmed`. Use `tentative` for fuzzy scrapes. |
| `sources` | array of source | | **Where you found the event — list every place.** See below. |
| `source` | string \| object | | Shorthand for a single source. Combined with `sources`. |

### Provenance: `sources` (and `source`)

**Always preserve where the event came from.** An event often appears in more
than one place (an official site *and* an Instagram post). List them all in
`sources` so we keep every original link; each one is stored and linked back to
the event. Use the singular `source` only when there's exactly one — it's just
shorthand and gets merged with `sources`.

Each source is either a bare string (e.g. `"instagram"`) or an object:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | `"manual"`, `"ai"`, `"instagram"`, `"website:<name>"`. Defaults to `manual`. |
| `url` | URL | Link to the origin item — the page/post where you found it. |
| `uid` | string | Stable origin id (post id, slug). Makes re-runs idempotent. |
| `scrapedAt` | ISO 8601 datetime | When it was seen. Defaults to ingest time. |

```json
"sources": [
  { "name": "website:teatroprincipal", "url": "https://teatroprincipal.example.com/agenda/x", "uid": "x" },
  { "name": "instagram", "url": "https://instagram.com/p/abc123", "uid": "abc123" }
]
```

> **Tips**
> - Include the `url` for every source — that's the link-back we surface.
> - Set `uid` when you can — it stops re-runs from creating duplicate source rows.
> - The event's top-level `url` defaults to the first source's `url` if you omit it.

## Validate before you ship

Lint any file against the schema without a database:

```bash
npm run validate data/events/my-event.json   # one file
npm run validate                              # everything in data/events/
```

The machine-readable contract lives at
[`schemas/event.schema.json`](../schemas/event.schema.json). Add this line to a
JSON file for live editor validation:

```json
"$schema": "../../schemas/event.schema.json"
```

## Batches

Any ingestion path also accepts an **array** of events:

```json
[
  { "title": "Evento A", "startsAt": "2026-06-21T20:00:00+02:00" },
  { "title": "Evento B", "startsAt": "2026-06-22T19:00:00+02:00" }
]
```
