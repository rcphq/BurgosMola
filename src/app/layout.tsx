import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Burgos Event Hub",
  description:
    "A consolidated, de-duplicated guide to events in and around Burgos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Burgos Event Hub
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              One guide to what&apos;s happening, gathered from many sources.
            </p>
          </header>
          <main>{children}</main>
          <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-400 dark:border-neutral-800">
            Burgos Event Hub — events merged from multiple sources.
          </footer>
        </div>
      </body>
    </html>
  );
}
