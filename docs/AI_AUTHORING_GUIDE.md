# AI authoring guide — creating event JSON

This doc is written to be **handed to another AI session** (or a person) to
produce events for Burgos Event Hub. Paste the "Prompt to copy" section below
into a fresh chat, then give it the raw material (a flyer photo, a webpage, an
Instagram caption, etc.).

The machine-readable contract is [`schemas/event.schema.json`](../schemas/event.schema.json)
(JSON Schema). The human reference is [`EVENT_FORMAT.md`](EVENT_FORMAT.md).

---

## The single most important rule: preserve sources

Every event **must** link back to where it came from, and there may be **more
than one** place. Put every origin in the `sources` array, each with its `url`.
Never invent a URL — only include links you actually saw. If you genuinely have
no link, use `{ "name": "manual" }` (or `{ "name": "ai" }`).

---

## Output contract

- Output **only** JSON — a single event object, or an array of event objects.
  No prose, no markdown fences.
- Required fields: `title`, `startsAt`. Everything else is optional — include
  what the source actually states; **do not guess**.
- `startsAt` / `endsAt`: ISO 8601 with a timezone offset. Burgos is `+02:00` in
  summer (CEST) and `+01:00` in winter (CET). If you only know the date but not
  the time, set `"status": "tentative"` and use a sensible placeholder time.
- `status`: `confirmed` normally; `tentative` if the date/time is uncertain
  (common for Instagram); `cancelled` if it was called off.
- `category`: short free text in Spanish (e.g. `música`, `teatro`, `deporte`,
  `gastronomía`, `infantil`, `exposición`).
- Default city is Burgos — only set `city` if it's somewhere else.

## Source objects

Each entry in `sources` (or the singular `source`) is a string or object:

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | `"instagram"`, `"website:<name>"`, `"manual"`, `"ai"`, … |
| `url` | strongly preferred | The exact page/post where you found it. |
| `uid` | when available | Stable id (post id, page slug). |
| `scrapedAt` | optional | ISO 8601 timestamp of when you saw it. |

Name conventions: use `website:<shortname>` for sites
(e.g. `website:teatroprincipal`, `website:aytoburgos`), `instagram` for IG,
`manual` for hand entry, `ai` when an AI produced it from unstructured text.

---

## Examples

**Minimal:**

```json
{ "title": "Concierto en el Teatro Principal", "startsAt": "2026-06-21T20:00:00+02:00", "source": "ai" }
```

**Multi-source (the important case):**

```json
{
  "title": "Concierto de órgano",
  "startsAt": "2026-07-05T19:30:00+02:00",
  "venueName": "Catedral de Burgos",
  "city": "Burgos",
  "category": "música",
  "url": "https://catedraldeburgos.example.com/agenda/organo",
  "sources": [
    { "name": "website:catedraldeburgos", "url": "https://catedraldeburgos.example.com/agenda/organo", "uid": "organo-2026-07-05" },
    { "name": "instagram", "url": "https://instagram.com/p/XYZ789", "uid": "XYZ789" }
  ]
}
```

**Several events at once (array):**

```json
[
  { "title": "Evento A", "startsAt": "2026-06-21T20:00:00+02:00", "source": { "name": "website:agenda", "url": "https://agenda.example.com/a" } },
  { "title": "Evento B", "startsAt": "2026-06-22T19:00:00+02:00", "source": { "name": "website:agenda", "url": "https://agenda.example.com/b" } }
]
```

---

## After generating — validate

Save the JSON into `data/events/<YYYY-MM-DD>-<slug>.json` and run:

```bash
npm run validate data/events/<YYYY-MM-DD>-<slug>.json
```

Fix anything it reports. Then either commit the file (auto-ingested on deploy)
or POST it to `/api/ingest` — see [`INGESTION.md`](INGESTION.md).

Duplicates are fine: the ingester fuzzy-matches the same event across sources
and **merges** them, so if you submit the same event from two sources (or twice),
their links are combined onto one event rather than duplicated.

---

## Prompt to copy

> You produce event data for "Burgos Event Hub". From the material I give you
> (web page, photo/flyer text, Instagram caption, etc.), output **only** JSON —
> a single event object or an array — matching this contract:
>
> - Required: `title` (string), `startsAt` (ISO 8601 with timezone offset;
>   Burgos is +02:00 in summer, +01:00 in winter).
> - Optional: `description`, `endsAt`, `venueName`, `address`, `city`
>   (default Burgos), `category` (Spanish, e.g. música/teatro/deporte),
>   `tags` (string[]), `url`, `imageUrl`, `price` (free text), `status`
>   (`confirmed` | `tentative` | `cancelled`).
> - **Provenance is mandatory**: include a `sources` array listing EVERY place
>   you found the event, each as `{ "name": "...", "url": "...", "uid": "..." }`.
>   Use `website:<name>` / `instagram` / `manual` / `ai` for names. Include the
>   real `url` for each — never invent links. If there's truly no link, use
>   `{ "name": "ai" }`.
> - Only include fields the source actually states; do not guess. If the
>   date/time is uncertain, set `"status": "tentative"`.
> - Output raw JSON only — no commentary, no code fences.
