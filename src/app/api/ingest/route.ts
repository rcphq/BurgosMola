import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ingestEvents } from "@/lib/events/ingest";

export const runtime = "nodejs";

/**
 * POST /api/ingest
 *
 * Body: a single event object or an array of them (see docs/EVENT_FORMAT.md).
 * Auth: send the shared secret as `Authorization: Bearer <INGEST_TOKEN>`
 *       or `x-ingest-token: <INGEST_TOKEN>`.
 *
 * Example:
 *   curl -X POST $BASE/api/ingest \
 *     -H "Authorization: Bearer $INGEST_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"title":"Concierto","startsAt":"2026-06-21T20:00:00+02:00"}'
 */
function isAuthorized(req: Request): boolean {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) return false; // fail closed if no token configured
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  const header = req.headers.get("x-ingest-token");
  return bearer === expected || header === expected;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const results = await ingestEvents(payload);
    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "validation failed", issues: err.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ingest failed" },
      { status: 500 },
    );
  }
}
