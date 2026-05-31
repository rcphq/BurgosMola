import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BurgosMola – Eventos en Burgos",
  description: "Guía unificada de eventos en Burgos. Conciertos, cultura, deporte, gastronomía y mucho más.",
  openGraph: {
    title: "BurgosMola – Eventos en Burgos",
    description: "Guía unificada de eventos en Burgos. Conciertos, cultura, deporte, gastronomía y mucho más.",
    url: "https://burgosmola.es",
    siteName: "BurgosMola",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BurgosMola – Eventos en Burgos",
    description: "Guía unificada de eventos en Burgos.",
  },
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
