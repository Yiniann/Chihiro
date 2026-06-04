"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import {
  deleteBookmarkAction,
  toggleBookmarkVisibilityAction,
} from "@/app/(admin)/admin/bookmarks/actions";
import { useToast } from "@/components/toast-provider";

export function BookmarkActionMenu({
  bookmarkId,
  bookmarkUrl,
  hidden,
}: {
  bookmarkId: number;
  bookmarkUrl: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
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
        className="inline-flex items-center gap-1.5 border-b border-transparent px-0 py-1 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        aria-label="更多操作"
      >
        操作
        <ChevronDown
          className={`h-3.5 w-3.5 transition duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 min-w-[8rem] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800/90 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          <Link
            href={`/admin/bookmarks/${bookmarkId}`}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            编辑书签
          </Link>

          <Link
            href={bookmarkUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            打开链接
          </Link>

          <form
            action={toggleBookmarkVisibilityAction}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              startTransition(async () => {
                await toggleBookmarkVisibilityAction(formData);
                showToast(hidden ? "已恢复显示书签" : "已隐藏书签");
                setIsOpen(false);
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="id" value={bookmarkId} />
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {isPending ? "处理中..." : hidden ? "恢复显示" : "隐藏书签"}
            </button>
          </form>

          <ConfirmActionDialog
            triggerLabel="删除书签"
            triggerClassName="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
            title="删除这个书签？"
            description="删除后无法撤销，这个链接会立刻从后台和前台移除。"
            confirmLabel="删除书签"
            action={deleteBookmarkAction}
            fields={[{ name: "id", value: bookmarkId }]}
            confirmTone="danger"
          />
        </div>
      ) : null}
    </div>
  );
}
