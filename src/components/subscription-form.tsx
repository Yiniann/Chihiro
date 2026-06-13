"use client";

import { Check, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { subscribeAction, type SubscribeState } from "@/app/(site)/subscribe/actions";
import { DialogShell } from "@/components/dialog-shell";
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

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={onClose}
      title="订阅"
      eyebrow="Newsletter"
      description={`欢迎订阅 ${siteName}，信笺初成，纸鹤已随风穿过隧道，抵达君前。`}
      maxWidthClassName="max-w-md"
      panelClassName=""
      overlayClassName="!bg-transparent !backdrop-blur-none dark:!bg-transparent"
      closeOnOverlayClick={false}
      onOverlayClick={triggerShake}
      panelAnimationControls={shakeControls}
      lockBodyScroll={false}
      bodyClassName="px-6 pb-6 pt-2"
    >
      <SubscriptionFormInner
        buttonLabel="订阅"
        onSuccess={onClose}
        showLabel={false}
      />
    </DialogShell>
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
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-n-4">
            Subscribe
          </span>
        ) : null}
        <div className="field-line">
          <Mail className="size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-line-input"
            placeholder="输入邮箱订阅更新"
          />
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-3 text-sm text-n-6">
          <input
            name="subscribedToPosts"
            type="checkbox"
            value="1"
            className="peer sr-only"
            checked={subscribedToPosts}
            onChange={(event) => setSubscribedToPosts(event.target.checked)}
          />
          <span className="flex size-4 items-center justify-center rounded-full border border-n-3 text-transparent transition peer-checked:border-primary peer-checked:text-primary dark:border-n-3 dark:peer-checked:border-primary dark:peer-checked:text-primary">
            <Check className="size-3" strokeWidth={2.4} />
          </span>
          <span>文章</span>
        </label>

        <label className="flex items-center gap-3 text-sm text-n-6">
          <input
            name="subscribedToUpdates"
            type="checkbox"
            value="1"
            className="peer sr-only"
            checked={subscribedToUpdates}
            onChange={(event) => setSubscribedToUpdates(event.target.checked)}
          />
          <span className="flex size-4 items-center justify-center rounded-full border border-n-3 text-transparent transition peer-checked:border-primary peer-checked:text-primary dark:border-n-3 dark:peer-checked:border-primary dark:peer-checked:text-primary">
            <Check className="size-3" strokeWidth={2.4} />
          </span>
          <span>动态</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          className="btn btn-primary h-10"
        >
          {buttonLabel}
        </button>
        {helperText ? (
          <p className="text-xs leading-6 text-n-5">
            {helperText}
          </p>
        ) : null}
      </div>
    </form>
  );
}
