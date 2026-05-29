import { asc, gte, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { events, eventSources, type EventRow } from "@/lib/db/schema";

/** A source link surfaced in the UI. */
export interface EventSourceLink {
  name: string;
  url: string | null;
}

export type EventWithSources = EventRow & { sources: EventSourceLink[] };

/** Upcoming events (from the start of today), soonest first, with their sources. */
export async function getUpcomingEvents(limit = 200): Promise<EventWithSources[]> {
  const db = getDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(events)
    .where(gte(events.startsAt, startOfToday))
    .orderBy(asc(events.startsAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const sources = await db
    .select()
    .from(eventSources)
    .where(
      inArray(
        eventSources.eventId,
        rows.map((r) => r.id),
      ),
    );

  // Group sources by event, de-duplicating by name+url for a clean display.
  const byEvent = new Map<string, EventSourceLink[]>();
  for (const s of sources) {
    const list = byEvent.get(s.eventId) ?? [];
    const key = `${s.source}|${s.sourceUrl ?? ""}`;
    if (!list.some((x) => `${x.name}|${x.url ?? ""}` === key)) {
      list.push({ name: s.source, url: s.sourceUrl });
    }
    byEvent.set(s.eventId, list);
  }

  return rows.map((r) => ({ ...r, sources: byEvent.get(r.id) ?? [] }));
}

/** Group events by their calendar day for sectioned rendering. */
export function groupByDay<T extends EventRow>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.startsAt.toISOString().slice(0, 10);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}
