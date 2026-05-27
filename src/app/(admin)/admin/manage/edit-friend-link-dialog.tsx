"use client";

import { Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type FriendLinkFormDefaults = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatarUrl: string | null;
  location: string | null;
  feedUrl: string | null;
  email: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export function EditFriendLinkDialog({
  action,
  defaults,
  triggerClassName,
  triggerLabel = "编辑",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults: FriendLinkFormDefaults;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-1.5 border-b border-transparent py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        }
      >
        <Pencil className="h-3.5 w-3.5" />
        {triggerLabel}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <motion.div
              className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/30 backdrop-blur-[2px] dark:bg-black/50"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="flex min-h-full items-start justify-center px-4 py-12 sm:px-6 sm:py-20">
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="edit-friend-link-dialog-title"
                  className="relative w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/94 shadow-[0_30px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/94 dark:shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
                  onClick={(event) => event.stopPropagation()}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                          Edit
                        </p>
                        <h2
                          id="edit-friend-link-dialog-title"
                          className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                        >
                          编辑友链
                        </h2>
                      </div>

                      <button
                        type="button"
                        aria-label="关闭"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <form action={action} className="grid gap-3">
                      <input type="hidden" name="id" value={defaults.id} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="站点标题" name="name" required defaultValue={defaults.name} />
                        <Field label="站点地址" name="url" type="url" required defaultValue={defaults.url} />
                        <Field
                          label="站点头像 / logo"
                          name="avatarUrl"
                          type="url"
                          defaultValue={defaults.avatarUrl ?? ""}
                        />
                        <Field label="邮箱" name="email" type="email" defaultValue={defaults.email ?? ""} />
                        <Field label="位置" name="location" defaultValue={defaults.location ?? ""} />
                        <Field
                          label="RSS 地址"
                          name="feedUrl"
                          type="url"
                          defaultValue={defaults.feedUrl ?? ""}
                        />
                        <Field
                          label="排序"
                          name="sortOrder"
                          type="number"
                          defaultValue={String(defaults.sortOrder)}
                        />
                      </div>

                      <Field
                        label="描述站点"
                        name="description"
                        multiline
                        defaultValue={defaults.description ?? ""}
                      />

                      <label className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <input
                          name="isVisible"
                          type="checkbox"
                          value="1"
                          defaultChecked={defaults.isVisible}
                          className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700"
                        />
                        <span>在前台展示这条友链</span>
                      </label>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
                        >
                          保存修改
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  multiline = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          name={name}
          rows={4}
          defaultValue={defaultValue}
          required={required}
          className="min-h-24 border-b border-zinc-200/80 bg-transparent px-0 py-2 text-sm leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
      )}
    </label>
  );
}
