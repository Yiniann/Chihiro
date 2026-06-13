"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDialogShake } from "@/components/use-dialog-shake";

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
  const { shakeControls, triggerShake } = useDialogShake();
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
          <p className="site-eyebrow uppercase tracking-[0.18em] text-n-4">
            Tags
          </p>
          {clearHref ? (
            <Link
              href={clearHref}
              className="site-eyebrow text-n-5 transition hover:text-primary dark:text-n-5"
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
              data-active={tag.isActive}
              className="site-eyebrow tag-chip"
            >
              {tag.label} ({tag.count})
            </Link>
          ))}
        </div>

        {hasTags ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="site-eyebrow mt-4 inline-flex items-center border-b border-n-2 pb-1 text-n-4 transition hover:border-n-4 hover:text-n-5 dark:border-n-2 dark:text-n-5 dark:hover:border-n-4 dark:hover:text-n-5"
          >
            Show all tags
          </button>
        ) : null}
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
        <div
          className="fixed inset-0 z-[90] overflow-y-auto bg-transparent"
          onClick={triggerShake}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-20">
            <motion.div animate={shakeControls} className="flex w-full justify-center">
              <div
                className="surface-shell w-full max-w-3xl overflow-hidden rounded-[1.75rem]"
                onClick={(event) => event.stopPropagation()}
              >
              <div className="border-b border-n-2 px-6 py-5 dark:border-n-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                      <h2 className="site-title-h3 tracking-tight text-n-6">
                        All tags
                      </h2>
                      <span className="site-eyebrow badge badge-soft">
                        {tags.length} total
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-n-4 transition hover:bg-n-1 hover:text-n-6 dark:text-n-5 dark:hover:bg-zinc-900 dark:hover:text-n-6"
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
                      data-active={tag.isActive}
                      className="site-meta tag-chip items-center px-3.5 py-2"
                    >
                      <span className="font-medium">{tag.label}</span>
                      <span className="site-eyebrow ml-2 opacity-70">({tag.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
              </div>
            </motion.div>
          </div>
        </div>
          ,
          document.body,
        )
        : null}
    </>
  );
}
