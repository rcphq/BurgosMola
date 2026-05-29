import { isDatabaseConfigured } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { getUpcomingEvents, groupByDay } from "@/lib/events/queries";

// Always read fresh from the DB; events change as scrapers/ingest run.
export const dynamic = "force-dynamic";

function formatDayHeading(isoDay: string): string {
  const date = new Date(`${isoDay}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
      <p className="font-medium text-neutral-800 dark:text-neutral-200">
        No events yet.
      </p>
      <p className="mt-2">
        Set <code>DATABASE_URL</code> in <code>.env.local</code>, run{" "}
        <code>npm run db:push</code>, then add events via{" "}
        <code>data/events/*.json</code> + <code>npm run ingest:files</code> or by
        POSTing to <code>/api/ingest</code>. See <code>docs/INGESTION.md</code>.
      </p>
      {detail && (
        <p className="mt-2 text-xs text-neutral-400">Details: {detail}</p>
      )}
    </div>
  );
}

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return <SetupNotice />;
  }

  let days: [string, Awaited<ReturnType<typeof getUpcomingEvents>>][];
  try {
    const events = await getUpcomingEvents();
    days = [...groupByDay(events).entries()];
  } catch (err) {
    return <SetupNotice detail={err instanceof Error ? err.message : String(err)} />;
  }

  if (days.length === 0) {
    return <SetupNotice />;
  }

  return (
    <div className="space-y-8">
      {days.map(([day, dayEvents]) => (
        <section key={day}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {formatDayHeading(day)}
          </h2>
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
