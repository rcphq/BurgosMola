import { asc, gte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { events, type EventRow } from "@/lib/db/schema";

/** Upcoming events (from the start of today), soonest first. */
export async function getUpcomingEvents(limit = 200): Promise<EventRow[]> {
  const db = getDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return db
    .select()
    .from(events)
    .where(gte(events.startsAt, startOfToday))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

/** Group events by their calendar day for sectioned rendering. */
export function groupByDay(rows: EventRow[]): Map<string, EventRow[]> {
  const groups = new Map<string, EventRow[]>();
  for (const row of rows) {
    const key = row.startsAt.toISOString().slice(0, 10);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}
