"use client";

import { AnimatePresence, motion, type MotionProps } from "framer-motion";
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
  closeOnOverlayClick?: boolean;
  onOverlayClick?: () => void;
  panelAnimationControls?: MotionProps["animate"];
  lockBodyScroll?: boolean;
  overlayScrollable?: boolean;
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
  closeOnOverlayClick = true,
  onOverlayClick,
  panelAnimationControls,
  lockBodyScroll = true,
  overlayScrollable = true,
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

    window.addEventListener("keydown", handleKeyDown);

    if (!lockBodyScroll) {
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lockBodyScroll, open, onOpenChange]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={[
            `fixed inset-0 z-[90] ${overlayScrollable ? "overflow-y-auto" : "overflow-hidden"} bg-zinc-950/35 backdrop-blur-md dark:bg-black/60`,
            overlayClassName ?? "",
          ].join(" ")}
          onClick={() => {
            onOverlayClick?.();

            if (closeOnOverlayClick) {
              onOpenChange(false);
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div
            className={[
              "flex min-h-full justify-center px-4 sm:px-6",
              align === "top" ? "items-start py-10 sm:py-14" : "items-center py-10",
            ].join(" ")}
          >
            <motion.div
              animate={panelAnimationControls}
              className={[widthClassName, maxWidthClassName].join(" ")}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={[
                  "relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-sm dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]",
                  panelClassName ?? "",
                ].join(" ")}
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.99 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="flex items-start justify-between gap-4 px-5 py-5">
                  <div className="min-w-0 pr-6">
                    {eyebrow ? (
                      <p className="site-eyebrow uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                        {eyebrow}
                      </p>
                    ) : null}
                    <h2
                      id={titleId}
                      className="site-title-h3 mt-2 tracking-tight text-zinc-950 dark:text-zinc-50"
                    >
                      {title}
                    </h2>
                    {description ? (
                      <div
                        id={descriptionId}
                        className="site-meta mt-3 text-zinc-500 dark:text-zinc-400"
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
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
