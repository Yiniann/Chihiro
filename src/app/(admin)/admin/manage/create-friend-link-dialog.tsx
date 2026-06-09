"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { DialogShell } from "@/components/dialog-shell";

export function CreateFriendLinkDialog({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

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
      <DialogShell
        open={isOpen}
        onOpenChange={setIsOpen}
        title="新增友链"
        eyebrow="Create"
        maxWidthClassName="max-w-4xl"
        align="top"
      >
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
      </DialogShell>
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
