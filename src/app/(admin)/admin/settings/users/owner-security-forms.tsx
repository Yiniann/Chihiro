"use client";

import { X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import {
  saveOwnerEmailAction,
  saveOwnerPasswordAction,
  type SaveOwnerEmailState,
  type SaveOwnerPasswordState,
} from "@/app/(admin)/admin/settings/users/actions";
import { useToast } from "@/components/toast-provider";

const initialEmailState: SaveOwnerEmailState = {
  error: null,
  success: null,
};

const initialPasswordState: SaveOwnerPasswordState = {
  error: null,
  success: null,
};

export function OwnerSecurityForms({
  defaultEmail,
  hasPasswordLogin,
}: {
  defaultEmail: string;
  hasPasswordLogin: boolean;
}) {
  const [dialog, setDialog] = useState<"email" | "password" | null>(null);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setDialog("email")}
          className="border-b border-transparent px-0 py-1 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        >
          绑定邮箱
        </button>
        {hasPasswordLogin ? (
          <button
            type="button"
            onClick={() => setDialog("password")}
            className="border-b border-transparent px-0 py-1 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            修改密码
          </button>
        ) : null}
      </div>

      <OwnerEmailDialog
        open={dialog === "email"}
        onClose={() => setDialog(null)}
        defaultEmail={defaultEmail}
      />
      <OwnerPasswordDialog
        open={dialog === "password"}
        onClose={() => setDialog(null)}
      />
    </>
  );
}

function OwnerEmailDialog({
  open,
  onClose,
  defaultEmail,
}: {
  open: boolean;
  onClose: () => void;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(saveOwnerEmailAction, initialEmailState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
    }

    if (state.success) {
      showToast(state.success);
      onClose();
    }
  }, [onClose, showToast, state.error, state.success]);

  return (
    <DialogShell open={open} onClose={onClose} title="绑定邮箱">
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            邮箱
          </span>
          <input
            name="email"
            type="email"
            defaultValue={defaultEmail}
            className="h-10 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="name@example.com"
          />
        </label>
        <label className="grid gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            当前密码
          </span>
          <input
            name="password"
            type="password"
            className="h-10 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="输入当前密码"
          />
        </label>
        <div className="flex justify-end">
          <SubmitButton idleText="保存邮箱" pendingText="保存中..." />
        </div>
      </form>
    </DialogShell>
  );
}

function OwnerPasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(saveOwnerPasswordAction, initialPasswordState);
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      formRef.current?.reset();
      showToast(state.success);
      onClose();
    }
  }, [onClose, showToast, state.error, state.success]);

  return (
    <DialogShell open={open} onClose={onClose} title="修改密码">
      <form ref={formRef} action={formAction} className="grid gap-4">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            当前密码
          </span>
          <input
            name="currentPassword"
            type="password"
            className="h-10 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="输入当前密码"
          />
        </label>
        <label className="grid gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            新密码
          </span>
          <input
            name="nextPassword"
            type="password"
            className="h-10 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="至少 8 位"
          />
        </label>
        <label className="grid gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            确认新密码
          </span>
          <input
            name="confirmPassword"
            type="password"
            className="h-10 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="再输一次新密码"
          />
        </label>
        <div className="flex justify-end">
          <SubmitButton idleText="修改密码" pendingText="保存中..." />
        </div>
      </form>
    </DialogShell>
  );
}

function DialogShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950/35 backdrop-blur-md dark:bg-black/60"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-10 sm:px-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-security-dialog-title"
          className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8">
            <h2
              id="owner-security-dialog-title"
              className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              {title}
            </h2>
          </div>

          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SubmitButton({
  idleText,
  pendingText,
}: {
  idleText: string;
  pendingText: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
