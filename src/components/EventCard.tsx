import type { EventRow } from "@/lib/db/schema";
import { AddToCalendar } from "@/components/AddToCalendar";
import { getCategoryColor } from "@/lib/categories";
import { ShareButtons } from "@/components/ShareButtons";

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function EventCard({ event }: { event: EventRow }) {
  const location = [event.venueName, event.city].filter(Boolean).join(" · ");

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>{formatTime(event.startsAt, event.timezone)}</span>
            {event.category && (
              <span className={`rounded px-1.5 py-0.5 ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
            )}
            {event.status === "tentative" && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                tentative
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-lg font-semibold">
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {event.title}
              </a>
            ) : (
              event.title
            )}
          </h3>
          {location && (
            <p className="mt-0.5 text-sm text-neutral-500">{location}</p>
          )}
          {event.description && (
            <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
              {event.description}
            </p>
          )}
          {event.price && (
            <p className="mt-2 text-xs font-medium text-neutral-500">
              {event.price}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <AddToCalendar event={event} />
        {event.url && (
          <ShareButtons
            title={event.title}
            url={event.url}
          />
        )}
      </div>
    </article>
  );
}
