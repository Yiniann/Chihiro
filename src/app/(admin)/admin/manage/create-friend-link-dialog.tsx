"use client";

import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function CreateFriendLinkDialog({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
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
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        添加友链
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
                  aria-labelledby="create-friend-link-dialog-title"
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
                          Create
                        </p>
                        <h2
                          id="create-friend-link-dialog-title"
                          className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                        >
                          新增友链
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
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="昵称" name="nickname" />
                        <Field label="站点标题" name="siteName" required />
                        <Field label="站点地址" name="siteUrl" type="url" required />
                        <Field label="站点头像 / logo" name="avatarUrl" type="url" />
                        <Field label="邮箱" name="contactEmail" type="email" />
                        <Field label="排序" name="sortOrder" type="number" defaultValue="0" />
                      </div>

                      <Field label="描述站点" name="description" />
                      <Field label="想说的话" name="message" />

                      <label className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <input
                          name="isVisible"
                          type="checkbox"
                          value="1"
                          defaultChecked
                          className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700"
                        />
                        <span>在前台展示这条友链</span>
                      </label>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
                        >
                          保存友链
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
