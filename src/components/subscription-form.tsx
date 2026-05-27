"use client";

import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeAction, type SubscribeState } from "@/app/(site)/subscribe/actions";
import { useToast } from "@/components/toast-provider";
import { useDialogShake } from "@/components/use-dialog-shake";

const initialState: SubscribeState = {
  error: null,
  success: null,
  nonce: 0,
};

export function SubscriptionForm() {
  return <SubscriptionFormInner />;
}

export function SubscribeDialogTrigger({
  children,
  className,
  siteName,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  siteName: string;
  disabled?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsDialogOpen(true);
          }
        }}
        className={className}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {children}
      </button>

      <SubscriptionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        siteName={siteName}
      />
    </>
  );
}

export function FooterSubscribeLink({
  children,
  className,
  siteName,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  siteName: string;
  disabled?: boolean;
}) {
  return (
    <SubscribeDialogTrigger className={className} siteName={siteName} disabled={disabled}>
      {children}
    </SubscribeDialogTrigger>
  );
}

export function SubscriptionDialog({
  isOpen,
  onClose,
  siteName,
}: {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
}) {
  const { shakeControls, triggerShake } = useDialogShake();

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] overflow-y-auto bg-transparent"
      onClick={triggerShake}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="flex min-h-full items-start justify-center px-4 py-20">
        <motion.div animate={shakeControls} className="flex w-full justify-center">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-dialog-title"
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-sm dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                  Newsletter
                </p>
                <h2
                  id="subscription-dialog-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                >
                  订阅
                </h2>
              </div>

              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
              欢迎订阅 {siteName}，信笺初成，纸鹤已随风穿过隧道，抵达君前。
            </p>
          </div>

            <div className="px-6 pb-6 pt-2">
              <SubscriptionFormInner
                buttonLabel="订阅"
                onSuccess={onClose}
                showLabel={false}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

function SubscriptionFormInner({
  buttonLabel = "订阅更新",
  helperText = null,
  onSuccess,
  showLabel = true,
}: {
  buttonLabel?: string;
  helperText?: string | null;
  onSuccess?: () => void;
  showLabel?: boolean;
}) {
  const [state, formAction] = useActionState(subscribeAction, initialState);
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribedToPosts, setSubscribedToPosts] = useState(false);
  const [subscribedToUpdates, setSubscribedToUpdates] = useState(false);

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
      onSuccess?.();
    }
  }, [onSuccess, showToast, state.error, state.nonce, state.success]);

  return (
    <form action={formAction} className="grid gap-3">
      <label className="grid gap-2">
        {showLabel ? (
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Subscribe
          </span>
        ) : null}
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:border-zinc-800/80 dark:text-zinc-200 dark:placeholder:text-zinc-600"
          placeholder="输入邮箱订阅更新"
        />
      </label>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            name="subscribedToPosts"
            type="checkbox"
            value="1"
            className="peer sr-only"
            checked={subscribedToPosts}
            onChange={(event) => setSubscribedToPosts(event.target.checked)}
          />
          <span className="flex size-4 items-center justify-center rounded-full border border-zinc-300 text-transparent transition peer-checked:border-primary peer-checked:text-primary dark:border-zinc-700 dark:peer-checked:border-primary dark:peer-checked:text-primary">
            <Check className="size-3" strokeWidth={2.4} />
          </span>
          <span>文章</span>
        </label>

        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            name="subscribedToUpdates"
            type="checkbox"
            value="1"
            className="peer sr-only"
            checked={subscribedToUpdates}
            onChange={(event) => setSubscribedToUpdates(event.target.checked)}
          />
          <span className="flex size-4 items-center justify-center rounded-full border border-zinc-300 text-transparent transition peer-checked:border-primary peer-checked:text-primary dark:border-zinc-700 dark:peer-checked:border-primary dark:peer-checked:text-primary">
            <Check className="size-3" strokeWidth={2.4} />
          </span>
          <span>动态</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
        >
          {buttonLabel}
        </button>
        {helperText ? (
          <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        ) : null}
      </div>
    </form>
  );
}
