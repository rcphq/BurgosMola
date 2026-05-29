/**
 * Event de-duplication helpers.
 *
 * Two layers:
 *  1. A deterministic `dedupeKey` (normalized title + day + venue) for the fast,
 *     exact-match path. Same key => definitely the same event.
 *  2. Fuzzy similarity (token Dice coefficient over normalized titles) for the
 *     near-misses where the same event is titled slightly differently across
 *     sources. Used to flag/merge likely duplicates on the same day.
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

/** YYYY-MM-DD in the event's own offset — the calendar day it falls on. */
export function dayKey(startsAtIso: string): string {
  // Keep the date portion as authored; we only need day-level granularity.
  return startsAtIso.slice(0, 10);
}

/**
 * Deterministic fingerprint for the exact-match path.
 * Venue is included when present so two different events sharing a title on the
 * same day (e.g. festival shows) don't collapse together.
 */
export function buildDedupeKey(input: {
  title: string;
  startsAt: string;
  venueName?: string | null;
}): string {
  return [
    normalizeTitle(input.title).replace(/\s+/g, "-"),
    dayKey(input.startsAt),
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

/** Above this title similarity (same day) we treat events as the same. */
export const FUZZY_MERGE_THRESHOLD = 0.82;
