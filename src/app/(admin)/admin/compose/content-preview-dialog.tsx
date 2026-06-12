"use client";

import type { ReactNode } from "react";
import { DialogShell } from "@/components/dialog-shell";

type ContentPreviewDialogProps = {
  open: boolean;
  title: string;
  subtitle?: string | null;
  meta?: ReactNode;
  body: ReactNode;
  onOpenChange: (open: boolean) => void;
};

export function ContentPreviewDialog({
  open,
  title,
  subtitle,
  meta,
  body,
  onOpenChange,
}: ContentPreviewDialogProps) {
  const hasHeaderContent = Boolean(title || subtitle || meta);

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="预览"
      eyebrow="Preview"
      maxWidthClassName="max-w-5xl"
      align="top"
      closeLabel="Close preview"
      bodyClassName="px-0 pb-0"
    >
      <div className="max-h-[80vh] overflow-y-auto px-6 py-10 sm:px-10 sm:py-12">
        <div className="mx-auto w-full max-w-3xl">
          {hasHeaderContent ? (
            <div className="grid gap-3">
              {title ? (
                <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-300">{subtitle}</p>
              ) : null}
              {meta ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {meta}
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className={
              hasHeaderContent ? "mt-10 border-t border-zinc-200/80 pt-10 dark:border-zinc-800/80" : ""
            }
          >
            {body}
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
