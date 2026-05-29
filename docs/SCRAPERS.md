# Scrapers (follow-up phase)

Scrapers are **decoupled** from the website. A scraper's only job is to produce
events in the [canonical format](EVENT_FORMAT.md) and hand them to ingestion —
either by writing a file into `data/events/` or by POSTing to `/api/ingest`.

This separation matters because the hard sources (Cloudflare-protected sites,
Instagram) need heavy tooling — a real headless browser, sometimes residential
proxies, longer runtimes — that doesn't belong in (and often can't run in) a
Vercel serverless function. Keeping scrapers outside means the site stays simple
and scraping can use whatever it needs.

## Recommended approach (for later)

```
scrapers/
  <source>/            one folder per source
    scrape.ts          -> outputs canonical event JSON
```

Each scraper:

1. Fetches/renders its source.
2. Maps results to the canonical event format. **Always set `source.name` and
   `source.uid`** so re-runs stay idempotent and dedupe/merge works well.
3. Either writes `data/events/<source>.json` (commit) or POSTs to `/api/ingest`.

Run them locally on demand at first; promote to **GitHub Actions** on a cron once
they're stable (Actions can run headless Chromium and store secrets/proxy creds).

## Source-specific notes

- **Plain websites** — `fetch` + an HTML parser (e.g. `cheerio`) is usually enough.
- **Cloudflare-protected** — a stealth headless browser
  (Playwright/Puppeteer + stealth) or a scraping API that solves the challenge.
  Be patient and respectful of rate limits; cache aggressively.
- **Instagram** — no stable public API for this; expect to drive a logged-in
  session and parse, or use a third-party API. Mark uncertain dates as
  `"status": "tentative"`.

## Current status

For now, adding events is **manual** (commit a JSON file or POST to the API).
The pipeline, format, and dedupe are already in place, so adding scrapers later
is purely additive — no changes to the site or database are required.
