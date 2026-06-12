"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DialogShell } from "@/components/dialog-shell";

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
  const isDanger = confirmTone === "danger";

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

      <DialogShell
        open={open}
        onOpenChange={setOpen}
        title={title}
        eyebrow={isDanger ? "Confirm" : "Action"}
        description={description}
        maxWidthClassName="max-w-md"
        bodyClassName="px-5 pb-5 pt-0"
      >
        <div className="mt-1 flex items-center justify-end gap-5">
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
      </DialogShell>
    </>
  );
}
