import { NextResponse } from "next/server";

import { buildICalendar } from "@/lib/events/ics";
import { getUpcomingEvents } from "@/lib/events/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/calendar.ics — a subscribable feed of all upcoming events.
 * Add this URL in Google/Apple Calendar as a "subscribe by URL" calendar to
 * keep a live view of everything in the hub.
 */
export async function GET() {
  const events = await getUpcomingEvents(500);
  const ics = buildICalendar(events);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="burgos-events.ics"',
    },
  });
}
