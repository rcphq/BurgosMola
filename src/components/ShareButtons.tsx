"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnClass =
    "rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Compartir por WhatsApp"
      >
        💬
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Compartir en Twitter/X"
      >
        𝕏
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="Compartir en Facebook"
      >
        f
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className={btnClass}
        aria-label="Copiar enlace"
      >
        {copied ? "Copiado!" : "🔗"}
      </button>
    </div>
  );
}
