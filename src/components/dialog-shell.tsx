"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useId } from "react";

type DialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  bodyClassName?: string;
  overlayClassName?: string;
  align?: "center" | "top";
  closeLabel?: string;
  headerEnd?: ReactNode;
  widthClassName?: string;
};

export function DialogShell({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  maxWidthClassName = "max-w-2xl",
  panelClassName,
  bodyClassName,
  overlayClassName,
  align = "center",
  closeLabel = "关闭",
  headerEnd,
  widthClassName = "w-full",
}: DialogShellProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/35 backdrop-blur-md dark:bg-black/60",
        overlayClassName ?? "",
      ].join(" ")}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={[
          "flex min-h-full justify-center px-4 sm:px-6",
          align === "top" ? "items-start py-10 sm:py-14" : "items-center py-10",
        ].join(" ")}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={[
            "relative overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 shadow-[0_24px_90px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]",
            widthClassName,
            maxWidthClassName,
            panelClassName ?? "",
          ].join(" ")}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-5">
            <div className="min-w-0 pr-6">
              {eyebrow ? (
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id={titleId}
                className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
              >
                {title}
              </h2>
              {description ? (
                <div
                  id={descriptionId}
                  className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400"
                >
                  {description}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {headerEnd}
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={["px-5 pb-5", bodyClassName ?? ""].join(" ")}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
