"use client";

import { Bell, Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { SubscribeDialogTrigger } from "@/components/subscription-form";

type HomeSiteActionsProps = {
  initialLikeCount: number;
  siteName: string;
  subscriptionsEnabled: boolean;
};

type SiteLikeState = {
  likeCount: number;
  liked: boolean;
};

export function HomeSiteActions({
  initialLikeCount,
  siteName,
  subscriptionsEnabled,
}: HomeSiteActionsProps) {
  const [likeState, setLikeState] = useState<SiteLikeState>({
    likeCount: initialLikeCount,
    liked: false,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function syncLikeState() {
      try {
        const response = await fetch("/api/site/like", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextState = (await response.json()) as SiteLikeState;

        if (!cancelled) {
          setLikeState(nextState);
        }
      } catch {
        // Keep the static count when the request fails.
      }
    }

    void syncLikeState();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLikeClick() {
    if (likeState.liked) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/site/like", {
          method: "POST",
        });

        if (!response.ok) {
          return;
        }

        setLikeState((await response.json()) as SiteLikeState);
      } catch {
        // Keep the previous state when the request fails.
      }
    });
  }

  return (
    <div className="mt-7 flex flex-wrap items-center gap-5 text-sm">
      <button
        type="button"
        onClick={handleLikeClick}
        disabled={isPending || likeState.liked}
        aria-pressed={likeState.liked}
        className="inline-flex min-w-[7.5rem] flex-col items-center gap-2 font-medium text-zinc-600 transition hover:text-primary disabled:cursor-default disabled:opacity-80 dark:text-zinc-300 dark:hover:text-primary"
      >
        <span>Keep This</span>
        <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          <Heart
            className={likeState.liked ? "size-4 fill-primary text-primary" : "size-4"}
            aria-hidden="true"
          />
          <span>{formatCount(likeState.likeCount)}</span>
        </span>
      </button>

      <SubscribeDialogTrigger
        siteName={siteName}
        disabled={!subscriptionsEnabled}
        className={
          subscriptionsEnabled
            ? "inline-flex min-w-[7.5rem] flex-col items-center gap-2 font-medium text-zinc-600 transition hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
            : "inline-flex min-w-[7.5rem] cursor-not-allowed flex-col items-center gap-2 font-medium text-zinc-400 dark:text-zinc-500"
        }
      >
        <span>{subscriptionsEnabled ? "Stay Close" : "Unavailable"}</span>
        <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          <Bell className="size-4" aria-hidden="true" />
        </span>
      </SubscribeDialogTrigger>
    </div>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}
