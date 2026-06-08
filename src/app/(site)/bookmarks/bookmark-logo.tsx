"use client";

import { useEffect, useMemo, useState } from "react";

export function BookmarkLogo({
  title,
  host,
  logoUrl,
  fallbackLogoUrl,
}: {
  title: string;
  host: string;
  logoUrl: string | null;
  fallbackLogoUrl: string | null;
}) {
  const candidates = useMemo(() => {
    return Array.from(new Set([logoUrl, fallbackLogoUrl].filter((item): item is string => Boolean(item))));
  }, [fallbackLogoUrl, logoUrl]);

  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(logoUrl ?? fallbackLogoUrl);

  useEffect(() => {
    let cancelled = false;

    async function resolveLogo() {
      for (const candidate of candidates) {
        const isAvailable = await canRenderImage(candidate);

        if (cancelled) {
          return;
        }

        if (isAvailable) {
          setResolvedLogoUrl(candidate);
          return;
        }
      }

      if (!cancelled) {
        setResolvedLogoUrl(null);
      }
    }

    void resolveLogo();

    return () => {
      cancelled = true;
    };
  }, [candidates]);

  if (resolvedLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedLogoUrl}
        alt={`${title} logo`}
        className="h-11 w-11 rounded-2xl border border-zinc-200/80 bg-white object-cover p-2 shadow-sm dark:border-white/14 dark:bg-zinc-950/80"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-100/80 text-sm font-semibold text-zinc-600 shadow-sm dark:border-white/14 dark:bg-white/8 dark:text-zinc-300">
      {getBookmarkInitial(title, host)}
    </div>
  );
}

function canRenderImage(src: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

function getBookmarkInitial(title: string, host: string) {
  const source = title.trim() || host.trim();
  return source.slice(0, 1).toUpperCase() || "?";
}
