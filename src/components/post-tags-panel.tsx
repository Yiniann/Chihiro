"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type TagItem = {
  slug: string;
  label: string;
  href: string;
  count: number;
  isActive: boolean;
};

type PostTagsPanelProps = {
  tags: TagItem[];
  visibleCount?: number;
  clearHref?: string | null;
};

export function PostTagsPanel({
  tags,
  visibleCount = 10,
  clearHref = null,
}: PostTagsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleTags = tags.slice(0, visibleCount);
  const hasTags = tags.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Tags
          </p>
          {clearHref ? (
            <Link
              href={clearHref}
              className="text-xs font-medium text-zinc-500 transition hover:text-primary dark:text-zinc-400"
            >
              Clear
            </Link>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <Link
              key={tag.slug}
              href={tag.href}
              className={`rounded-2xl px-3 py-1.5 text-xs font-medium transition ${
                tag.isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tag.label} ({tag.count})
            </Link>
          ))}
        </div>

        {hasTags ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-4 inline-flex items-center border-b border-zinc-200 pb-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
          >
            Show all tags
          </button>
        ) : null}
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/30 backdrop-blur-[2px] dark:bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-20">
            <div
              className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_30px_120px_rgba(15,23,42,0.16)] dark:border-zinc-800/80 dark:bg-[linear-gradient(180deg,rgba(10,10,14,0.98),rgba(16,18,24,0.96))] dark:shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-zinc-200/80 px-6 py-5 dark:border-zinc-800/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                        All tags
                      </h2>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[0.7rem] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        {tags.length} total
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                    aria-label="Close all tags dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[32rem] overflow-y-auto px-6 py-6">
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={tag.href}
                      onClick={() => setIsOpen(false)}
                      className={`inline-flex items-center rounded-2xl px-3.5 py-2 text-sm transition ${
                        tag.isActive
                          ? "bg-primary text-primary-foreground shadow-[0_10px_30px_rgb(var(--primary-rgb)/0.22)]"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="font-medium">{tag.label}</span>
                      <span className="ml-2 text-[0.72rem] opacity-70">({tag.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
          ,
          document.body,
        )
        : null}
    </>
  );
}
