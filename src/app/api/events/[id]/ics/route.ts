import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { buildICalendar } from "@/lib/events/ics";

export const runtime = "nodejs";

/** GET /api/events/:id/ics — download a single event as an .ics file. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [event] = await getDb()
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ics = buildICalendar(event);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.id}.ics"`,
    },
  });
}
