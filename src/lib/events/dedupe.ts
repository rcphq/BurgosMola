/**
 * Event de-duplication helpers.
 *
 * Two layers:
 *  1. A deterministic `dedupeKey` (normalized title + start time + venue) for the
 *     fast, exact-match path. Same key => definitely the same event. Start time
 *     is part of identity so repeat showings of the same title at the same venue
 *     on the same day (e.g. a 17:00 and a 21:00 performance) stay distinct.
 *  2. Fuzzy similarity (Dice coefficient over normalized titles) for the
 *     near-misses where the same event is titled slightly differently across
 *     sources. Scoped to a small time window so it merges cross-source listings
 *     of one showing, not two different showings.
 */

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // drop diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string | undefined | null): string {
  if (!value) return "";
  return normalizeTitle(value).replace(/\s+/g, "-");
}

/**
 * Absolute start instant truncated to the minute (UTC), e.g. 2026-06-21T18:00.
 * Using the instant means the same moment expressed in different offsets yields
 * the same key, while different showings get different keys.
 */
export function instantKey(startsAtIso: string): string {
  return new Date(startsAtIso).toISOString().slice(0, 16);
}

/**
 * Deterministic fingerprint for the exact-match path: title + start time + venue.
 * Including the start time keeps same-day repeat showings (same title, same
 * venue, different time) as separate events.
 */
export function buildDedupeKey(input: {
  title: string;
  startsAt: string;
  venueName?: string | null;
}): string {
  return [
    normalizeTitle(input.title).replace(/\s+/g, "-"),
    instantKey(input.startsAt),
    slug(input.venueName),
  ].join("|");
}

/**
 * Sørensen–Dice coefficient over character bigrams. Cheap, dependency-free,
 * and robust to minor wording/spelling differences. Returns 0..1.
 */
export function diceSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;

  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };

  const aMap = bigrams(na);
  const bMap = bigrams(nb);
  let intersection = 0;
  for (const [bg, count] of aMap) {
    const other = bMap.get(bg);
    if (other) intersection += Math.min(count, other);
  }
  return (2 * intersection) / (na.length - 1 + (nb.length - 1));
}

/** Above this title similarity (within the time window) events are the same. */
export const FUZZY_MERGE_THRESHOLD = 0.82;

/**
 * Max gap between start times for a fuzzy match to count as the same event.
 * Cross-source listings of one showing usually agree to the minute; separate
 * showings are hours apart, so 90 minutes cleanly separates them.
 */
export const FUZZY_TIME_WINDOW_MINUTES = 90;
