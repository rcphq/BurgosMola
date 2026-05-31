import { and, asc, gte, lte, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { events, type EventRow } from "@/lib/db/schema";

export type EventFilters = {
  category?: string;
  date?: "today" | "weekend" | "week" | "month";
};

/** Upcoming events (from the start of today), soonest first. */
export async function getUpcomingEvents(
  limit = 200,
  filters: EventFilters = {}
): Promise<EventRow[]> {
  const db = getDb();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Date range bounds
  let rangeEnd: Date | undefined;
  let rangeStart = startOfToday;

  if (filters.date === "today") {
    rangeEnd = new Date(startOfToday);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (filters.date === "weekend") {
    // Next Saturday and Sunday from today
    const day = now.getDay(); // 0=Sun,6=Sat
    const daysUntilSat = day === 6 ? 0 : (6 - day);
    const sat = new Date(startOfToday);
    sat.setDate(sat.getDate() + daysUntilSat);
    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    sun.setHours(23, 59, 59, 999);
    rangeStart = sat;
    rangeEnd = sun;
  } else if (filters.date === "week") {
    rangeEnd = new Date(startOfToday);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
  } else if (filters.date === "month") {
    rangeEnd = new Date(startOfToday);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
  }

  const conditions = [gte(events.startsAt, rangeStart)];
  if (rangeEnd) conditions.push(lte(events.startsAt, rangeEnd));
  if (filters.category) conditions.push(eq(events.category, filters.category));

  return db
    .select()
    .from(events)
    .where(and(...conditions))
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
