# data/events

Drop event JSON files here. Each file is a single event **or** an array of
events in the [canonical format](../../docs/EVENT_FORMAT.md).

```bash
npm run ingest:files   # ingest everything in this folder (idempotent)
```

- Start from [`_TEMPLATE.jsonc`](_TEMPLATE.jsonc): copy it to a real `.json`
  file, fill it in, delete what you don't use. (The `.jsonc` template itself is
  never ingested or validated — those only pick up `*.json`.)
- Naming: `YYYY-MM-DD-short-title.json` keeps things sorted and readable. The
  filename is not parsed — only the contents matter.
- Idempotent: re-ingesting merges sources instead of creating duplicates, so
  it's safe to run repeatedly (and on every deploy).
- `example-event.json` is just a sample — delete it once you add real events.

You can create files straight from the GitHub mobile app, which makes this a
handy "saw an event, log it now" path from your phone.
