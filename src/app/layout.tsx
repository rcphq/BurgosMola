import type { Metadata } from "next";
import Link from "next/link";

import { Nav } from "@/components/Nav";
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
  icons: {
    icon: "/favicon.svg",
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
            <Link href="/" aria-label="BurgosMola inicio">
              <img src="/logo.svg" alt="BurgosMola" className="h-10 w-auto" />
            </Link>
            <p className="mt-2 text-sm text-neutral-500">
              Guía de eventos en Burgos — conciertos, cultura, deporte y más.
            </p>
            <Nav />
          </header>
          <main>{children}</main>
          <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-400 dark:border-neutral-800">
            BurgosMola — eventos en Burgos
          </footer>
        </div>
      </body>
    </html>
  );
}
