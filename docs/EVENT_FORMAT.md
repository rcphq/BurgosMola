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
  "source": {
    "name": "instagram",
    "url": "https://instagram.com/p/abc123",
    "uid": "abc123",
    "scrapedAt": "2026-05-29T10:00:00+02:00"
  }
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
| `source` | string \| object | | Provenance. A bare string is shorthand for `{ "name": "..." }`. |

### `source` object

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | `"manual"`, `"ai"`, `"instagram"`, `"website:<name>"`. Defaults to `manual`. |
| `url` | URL | Link to the origin item. |
| `uid` | string | Stable origin id (post id, slug). Makes re-runs idempotent. |
| `scrapedAt` | ISO 8601 datetime | When it was seen. Defaults to ingest time. |

> **Tip:** always set `source.uid` when you can — it's what stops a scraper from
> creating duplicate source rows when it re-runs over the same listing.

## Batches

Any ingestion path also accepts an **array** of events:

```json
[
  { "title": "Evento A", "startsAt": "2026-06-21T20:00:00+02:00" },
  { "title": "Evento B", "startsAt": "2026-06-22T19:00:00+02:00" }
]
```
