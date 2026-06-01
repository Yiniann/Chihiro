"use client";

import { FriendLinkApplicationStatus } from "@prisma/client";
import { Ban, Check, ChevronDown, RotateCcw, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { EditFriendLinkDialog } from "@/app/(admin)/admin/manage/edit-friend-link-dialog";
import {
  approveFriendLinkApplicationAction,
  deleteFriendLinkApplicationAction,
  holdFriendLinkApplicationAction,
  rejectFriendLinkApplicationAction,
} from "@/app/(admin)/admin/manage/application-actions";
import { saveFriendLinkAction } from "@/app/(admin)/admin/manage/actions";

export function FriendLinkActionMenu({
  applicationId,
  friendLinkDefaults = null,
  status,
}: {
  applicationId: number;
  friendLinkDefaults?: {
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
  } | null;
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
          {friendLinkDefaults ? (
            <EditFriendLinkDialog
              action={saveFriendLinkAction}
              defaults={friendLinkDefaults}
              triggerLabel="编辑"
              triggerClassName="flex w-full items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            />
          ) : null}
          {status !== FriendLinkApplicationStatus.APPROVED ? (
            <ActionForm
              action={approveFriendLinkApplicationAction}
              id={applicationId}
              label="通过"
              icon={Check}
            />
          ) : null}
          {status !== FriendLinkApplicationStatus.PENDING ? (
            <ActionForm
              action={holdFriendLinkApplicationAction}
              id={applicationId}
              label="转待审"
              icon={RotateCcw}
            />
          ) : null}
          {status !== FriendLinkApplicationStatus.REJECTED ? (
            <ActionForm
              action={rejectFriendLinkApplicationAction}
              id={applicationId}
              label="拒绝"
              icon={Ban}
              tone="danger"
            />
          ) : null}
          {status === FriendLinkApplicationStatus.REJECTED ? (
            <ConfirmActionDialog
              triggerLabel="删除"
              triggerClassName="flex w-full items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              triggerContent={
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>删除</span>
                </>
              }
              title="删除这条申请？"
              description="删除后无法撤销，这条已拒绝的友链申请会被永久移除。"
              confirmLabel="删除申请"
              action={deleteFriendLinkApplicationAction}
              fields={[{ name: "id", value: applicationId }]}
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
  icon: Icon,
  tone = "default",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={[
          "flex w-full items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium transition",
          tone === "danger"
            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
        ].join(" ")}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}
