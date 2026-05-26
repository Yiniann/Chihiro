"use client";

import {
  deletePostAction,
  publishPostAction,
  unpublishPostAction,
} from "@/app/(admin)/admin/actions";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import Link from "next/link";
import { ChevronDown, Ellipsis, ExternalLink, FilePenLine, FileText, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PostActionMenuProps = {
  postId: number;
  isPublished: boolean;
  editHref?: string;
  viewHref?: string;
  compact?: boolean;
};

export function PostActionMenu({
  postId,
  isPublished,
  editHref,
  viewHref,
  compact = false,
}: PostActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (!target || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={
          compact
            ? "inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-400"
            : "inline-flex list-none items-center gap-1.5 border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        }
        aria-label="更多操作"
      >
        {compact ? (
          <Ellipsis className="h-4.5 w-4.5" />
        ) : (
          <>
            操作
            <ChevronDown
              className={`h-3.5 w-3.5 transition duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 min-w-[7.5rem] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800/90 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          {editHref ? (
            <Link
              href={editHref}
              className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {compact ? null : <FilePenLine className="h-3.5 w-3.5" />}
              编辑文章
            </Link>
          ) : null}
          {viewHref ? (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {compact ? null : <ExternalLink className="h-3.5 w-3.5" />}
              查看站点
            </a>
          ) : compact ? (
            <span className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-300 dark:text-zinc-700">
              未发布，无法查看
            </span>
          ) : null}
          {isPublished ? (
            <form action={unpublishPostAction}>
              <input type="hidden" name="id" value={postId} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                {compact ? null : <FileText className="h-3.5 w-3.5" />}
                转为草稿
              </button>
            </form>
          ) : (
            <form action={publishPostAction}>
              <input type="hidden" name="id" value={postId} />
              <button
                type="submit"
                className="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                设置为发布
              </button>
            </form>
          )}
          <ConfirmActionDialog
            triggerLabel="移到回收站"
            triggerClassName="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            triggerContent={
              <>
                {compact ? null : <Trash2 className="h-3.5 w-3.5" />}
                移到回收站
              </>
            }
            title="将这篇文章移到回收站？"
            description="移入回收站后不会立刻彻底删除，你可以稍后在回收站里恢复或永久移除。"
            confirmLabel="移到回收站"
            action={deletePostAction}
            fields={[{ name: "id", value: postId }]}
            confirmTone="danger"
          />
        </div>
      ) : null}
    </div>
  );
}
