"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";

type ConfirmActionDialogProps = {
  triggerLabel: string;
  triggerClassName: string;
  triggerContent?: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "danger" | "primary";
  disabled?: boolean;
  action: (formData: FormData) => void | Promise<void>;
  fields: Array<{
    name: string;
    value: string | number;
  }>;
};

export function ConfirmActionDialog({
  triggerLabel,
  triggerClassName,
  triggerContent,
  title,
  description,
  confirmLabel,
  confirmTone = "danger",
  disabled = false,
  action,
  fields,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const isDanger = confirmTone === "danger";

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={triggerLabel || confirmLabel}
      >
        {triggerContent ?? triggerLabel}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/35 backdrop-blur-md dark:bg-black/60"
              onClick={() => setOpen(false)}
            >
              <div className="flex min-h-full items-center justify-center px-4 py-10 sm:px-6">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="关闭"
                    onClick={() => setOpen(false)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="pr-8">
                    <p
                      className={[
                        "text-[0.68rem] font-medium uppercase tracking-[0.24em]",
                        isDanger ? "text-rose-500 dark:text-rose-400" : "text-zinc-400 dark:text-zinc-500",
                      ].join(" ")}
                    >
                      {isDanger ? "Confirm" : "Action"}
                    </p>
                    <h2
                      id={titleId}
                      className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                    >
                      {title}
                    </h2>
                    <p
                      id={descriptionId}
                      className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400"
                    >
                      {description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-5">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-10 items-center justify-center text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      取消
                    </button>
                    <form action={action}>
                      {fields.map((field) => (
                        <input key={field.name} type="hidden" name={field.name} value={field.value} />
                      ))}
                      <button
                        type="submit"
                        className={[
                          "inline-flex h-10 items-center justify-center rounded-2xl px-1 text-sm font-medium transition",
                          isDanger
                            ? "text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                            : "text-zinc-950 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-white",
                        ].join(" ")}
                      >
                        {confirmLabel}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
