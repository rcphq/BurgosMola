"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Próximos", href: "/" },
  { label: "Pasados", href: "/pasados" },
  { label: "Lugares", href: "/lugares" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {TABS.map(({ label, href }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
