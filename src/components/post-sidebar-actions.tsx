"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Gift, Heart, MessageCircle, Share2 } from "lucide-react";

type PostSidebarActionsProps = {
  postId: number;
  title: string;
  initialLikeCount: number;
};

type LikeState = {
  likeCount: number;
  liked: boolean;
};

export function PostSidebarActions({
  postId,
  title,
  initialLikeCount,
}: PostSidebarActionsProps) {
  const [likeState, setLikeState] = useState<LikeState>({
    likeCount: initialLikeCount,
    liked: false,
  });
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function syncLikeState() {
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextState = (await response.json()) as LikeState;

        if (!cancelled) {
          setLikeState(nextState);
        }
      } catch {
        // Keep the static count when engagement is unavailable.
      }
    }

    void syncLikeState();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  function handleLikeClick() {
    if (likeState.liked) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
        });

        if (!response.ok) {
          return;
        }

        setLikeState((await response.json()) as LikeState);
      } catch {
        // Keep the previous state when the request fails.
      }
    });
  }

  function handleShareClick() {
    startTransition(async () => {
      try {
        const url = window.location.href;

        if (navigator.share) {
          await navigator.share({ title, url });
        } else {
          await navigator.clipboard.writeText(url);
          setShareState("copied");
          window.setTimeout(() => setShareState("idle"), 1600);
        }
      } catch {
        // The user may cancel native share; no UI recovery is needed.
      }
    });
  }

  return (
    <section className="mt-7 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div className="flex flex-col gap-2 [@media(max-height:720px)]:flex-row">
        <div className="group relative flex w-fit items-center">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={isPending || likeState.liked}
            aria-pressed={likeState.liked}
            title={`点赞 · ${likeState.likeCount}`}
            className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md px-2 text-zinc-500 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default disabled:opacity-80 dark:text-zinc-400"
          >
            <Heart
              className={likeState.liked ? "size-4 fill-primary text-primary" : "size-4"}
              aria-hidden="true"
            />
            <span className="text-xs font-medium tabular-nums">{likeState.likeCount}</span>
            <span className="sr-only">点赞</span>
          </button>
          <ActionTooltip>点赞</ActionTooltip>
        </div>
        <div className="group relative flex w-fit items-center">
          <button
            type="button"
            onClick={handleShareClick}
            disabled={isPending}
            title={shareState === "copied" ? "已复制链接" : "分享"}
            className="inline-flex size-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400"
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span className="sr-only">分享文章</span>
          </button>
          <ActionTooltip>分享文章</ActionTooltip>
        </div>
        <div className="group relative flex w-fit items-center">
          <button
            type="button"
            disabled
            title="订阅"
            className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md text-zinc-300 dark:text-zinc-700"
          >
            <Bell className="size-4" aria-hidden="true" />
            <span className="sr-only">订阅</span>
          </button>
          <ActionTooltip>订阅</ActionTooltip>
        </div>
        <div className="group relative flex w-fit items-center">
          <button
            type="button"
            disabled
            title="评论即将开放"
            className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md text-zinc-300 dark:text-zinc-700"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span className="sr-only">评论</span>
          </button>
          <ActionTooltip>评论</ActionTooltip>
        </div>
        <div className="group relative flex w-fit items-center">
          <button
            type="button"
            disabled
            title="捐赠即将开放"
            className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md text-zinc-300 dark:text-zinc-700"
          >
            <Gift className="size-4" aria-hidden="true" />
            <span className="sr-only">向作者捐赠</span>
          </button>
          <ActionTooltip>向作者捐赠</ActionTooltip>
        </div>
      </div>
    </section>
  );
}

function ActionTooltip({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg shadow-zinc-950/10 transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-950"
    >
      {children}
    </span>
  );
}
