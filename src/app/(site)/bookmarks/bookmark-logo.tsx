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
        className="surface-shell h-11 w-11 rounded-2xl bg-white object-cover p-2 dark:bg-n-1/80"
      />
    );
  }

  return (
    <div className="surface-shell flex h-11 w-11 items-center justify-center rounded-2xl bg-n-1/80 text-sm font-semibold text-n-5 dark:bg-white/8 dark:text-n-5">
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
