"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

const DATE_CHIPS = [
  { label: "Hoy", value: "today" },
  { label: "Este fin de semana", value: "weekend" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
] as const;

/** When true, hide the future-oriented date chips (e.g. on the Pasados archive). */
export function FilterBar({ showDateChips = true }: { showDateChips?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const activeDate = params.get("date") ?? "";
  const activeView = params.get("view") ?? "list";

  function setFilter(key: "category" | "date", value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) {
      next.delete(key); // toggle off
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setView(value: "list" | "calendar") {
    const next = new URLSearchParams(params.toString());
    if (value === "list") {
      next.delete("view");
    } else {
      next.set("view", value);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = activeCategory || activeDate;

  const chipBase =
    "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap";
  const chipActive =
    "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
  const chipInactive =
    "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800";

  return (
    <div className="mb-6 space-y-2">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter("category", cat)}
            className={`${chipBase} ${activeCategory === cat ? chipActive : chipInactive}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Date chips + view toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
          {showDateChips &&
            DATE_CHIPS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter("date", value)}
                className={`${chipBase} ${activeDate === value ? chipActive : chipInactive}`}
              >
                {label}
              </button>
            ))}
          {hasFilters && (
            <Link
              href={pathname}
              className="ml-auto shrink-0 text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
        <div className="flex shrink-0 gap-1 pb-1 pl-2 border-l border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setView("list")}
            className={`${chipBase} ${activeView === "list" ? chipActive : chipInactive}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`${chipBase} ${activeView === "calendar" ? chipActive : chipInactive}`}
          >
            Semana
          </button>
        </div>
      </div>
    </div>
  );
}
