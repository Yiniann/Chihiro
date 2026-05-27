"use client";

import { FriendLinkApplicationStatus } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import {
  approveFriendLinkApplicationAction,
  holdFriendLinkApplicationAction,
  rejectFriendLinkApplicationAction,
} from "@/app/(admin)/admin/manage/application-actions";
import { deleteFriendLinkAction } from "@/app/(admin)/admin/manage/actions";

export function FriendLinkActionMenu({
  applicationId,
  friendLinkId = null,
  status,
}: {
  applicationId: number;
  friendLinkId?: number | null;
  status: FriendLinkApplicationStatus;
}) {
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
        className="inline-flex items-center gap-1.5 border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        aria-label="更多操作"
      >
        操作
        <ChevronDown
          className={`h-3.5 w-3.5 transition duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 min-w-[8rem] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800/90 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          {status !== FriendLinkApplicationStatus.APPROVED ? (
            <ActionForm
              action={approveFriendLinkApplicationAction}
              id={applicationId}
              label="通过"
            />
          ) : null}
          {status !== FriendLinkApplicationStatus.PENDING ? (
            <ActionForm action={holdFriendLinkApplicationAction} id={applicationId} label="转待审" />
          ) : null}
          {status !== FriendLinkApplicationStatus.REJECTED ? (
            <ActionForm
              action={rejectFriendLinkApplicationAction}
              id={applicationId}
              label="拒绝"
              tone="danger"
            />
          ) : null}
          {friendLinkId ? (
            <ConfirmActionDialog
              triggerLabel="删除"
              triggerClassName="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              title="删除这条友链？"
              description="删除后无法撤销，这条友链会从公开展示中移除。"
              confirmLabel="删除友链"
              action={deleteFriendLinkAction}
              fields={[{ name: "id", value: friendLinkId }]}
              confirmTone="danger"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ActionForm({
  action,
  id,
  label,
  tone = "default",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={[
          "flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium transition",
          tone === "danger"
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
        ].join(" ")}
      >
        {label}
      </button>
    </form>
  );
}
