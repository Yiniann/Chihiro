"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Eye, Heart } from "lucide-react";

type EngagementState = {
  viewCount: number;
  likeCount: number;
  liked: boolean;
};

type PostEngagementProps = {
  postId: number;
  initialViewCount: number;
  initialLikeCount: number;
};

export function PostEngagement({
  postId,
  initialViewCount,
  initialLikeCount,
}: PostEngagementProps) {
  const [state, setState] = useState<EngagementState>({
    viewCount: initialViewCount,
    likeCount: initialLikeCount,
    liked: false,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const viewStorageKey = useMemo(() => `chihiro:post-view:${postId}`, [postId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsMounted(true);
      }
    });

    async function syncEngagement() {
      try {
        const likeResponse = await fetch(`/api/posts/${postId}/like`, {
          method: "GET",
          cache: "no-store",
        });

        if (likeResponse.ok) {
          const likeState = (await likeResponse.json()) as EngagementState;
          if (!cancelled) {
            setState(likeState);
          }
        }

        const today = new Date().toISOString().slice(0, 10);
        if (window.localStorage.getItem(viewStorageKey) === today) {
          return;
        }

        const viewResponse = await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
        });

        if (viewResponse.ok) {
          const viewState = (await viewResponse.json()) as Omit<EngagementState, "liked">;
          window.localStorage.setItem(viewStorageKey, today);
          if (!cancelled) {
            setState((current) => ({
              ...current,
              viewCount: viewState.viewCount,
              likeCount: viewState.likeCount,
            }));
          }
        }
      } catch {
        // Engagement should never block reading the article.
      }
    }

    void syncEngagement();

    return () => {
      cancelled = true;
    };
  }, [postId, viewStorageKey]);

  if (!isMounted) {
    return <span className="inline-flex min-h-5 min-w-32" aria-hidden="true" />;
  }

  function handleLikeClick() {
    if (state.liked) {
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

        setState((await response.json()) as EngagementState);
      } catch {
        // Keep the previous optimistic-free state when the request fails.
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="size-4" aria-hidden="true" />
        <span>{formatCount(state.viewCount)} 阅读</span>
      </span>
      <button
        type="button"
        onClick={handleLikeClick}
        disabled={isPending || state.liked}
        aria-pressed={state.liked}
        className="inline-flex items-center gap-1.5 text-n-5 transition-colors hover:text-primary disabled:cursor-default disabled:opacity-80 dark:text-n-5"
      >
        <Heart
          className={state.liked ? "size-4 fill-primary text-primary" : "size-4"}
          aria-hidden="true"
        />
        <span>{formatCount(state.likeCount)} 喜欢</span>
      </button>
    </span>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}
