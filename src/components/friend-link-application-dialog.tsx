"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useActionState, useEffect, useState } from "react";
import {
  submitFriendLinkApplicationAction,
  type SubmitFriendLinkApplicationState,
} from "@/app/(site)/friends/actions";
import { useToast } from "@/components/toast-provider";
import { useDialogShake } from "@/components/use-dialog-shake";

const initialState: SubmitFriendLinkApplicationState = {
  error: null,
  success: null,
  nonce: 0,
};

type FriendLinkApplicationDialogProps = {
  triggerLabel?: string;
};

export function FriendLinkApplicationDialog({
  triggerLabel = "申请友链",
}: FriendLinkApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-primary h-10"
      >
        {triggerLabel}
      </button>

      <FriendLinkApplicationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function FriendLinkApplicationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
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
      <div className="flex min-h-full items-start justify-center px-4 py-12 sm:px-6 sm:py-20">
        <motion.div animate={shakeControls} className="flex w-full justify-center">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="friend-link-application-dialog-title"
            className="surface-shell relative w-full max-w-2xl overflow-hidden rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-n-4">
                  Apply
                </p>
                <h2
                  id="friend-link-application-dialog-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-n-6"
                >
                  申请友链
                </h2>
              </div>

              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-n-4 transition hover:bg-n-1 hover:text-n-6 dark:text-n-5 dark:hover:bg-zinc-900 dark:hover:text-n-6"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

            <div className="px-6 pb-6 pt-2">
              <FriendLinkApplicationForm onSuccess={onClose} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

function FriendLinkApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useActionState(
    submitFriendLinkApplicationAction,
    initialState,
  );
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
      onSuccess();
    }
  }, [onSuccess, showToast, state.error, state.nonce, state.success]);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="昵称"
          name="nickname"
          required
          placeholder="怎么称呼你"
        />
        <Field
          label="站点标题"
          name="siteName"
          required
          placeholder="你的站点叫什么"
        />
        <Field
          label="站点地址"
          name="siteUrl"
          required
          placeholder="https://example.com"
        />
        <Field
          label="头像 / 站标"
          name="avatarUrl"
          placeholder="https://example.com/avatar.png"
        />
        <Field
          label="RSS 地址"
          name="rssUrl"
          type="url"
          placeholder="https://example.com/feed.xml"
        />
        <Field
          label="联系邮箱"
          name="contactEmail"
          type="email"
          required
          placeholder="name@example.com"
        />
      </div>

      <Field
        label="描述站点"
        name="description"
        placeholder="可以简单介绍一下你的网站"
      />

      <Field
        label="想说的话"
        name="message"
        placeholder="比如已添加本站友链，或者你想补充的说明"
      />

      <div className="flex items-center justify-end gap-3">
        <p className="text-xs leading-6 text-n-5">
          提交后会进入后台待审核队列。
        </p>
        <button
          type="submit"
          className="btn btn-primary h-10"
        >
          提交申请
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  multiline = false,
  rows = 4,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-n-4">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </span>
      {multiline ? (
        <textarea
          name={name}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className="min-h-24 border-b border-n-2 bg-transparent px-0 py-2 text-sm leading-7 text-n-6 outline-none transition placeholder:text-n-4 focus:border-n-4 dark:border-n-2 dark:text-n-6 dark:placeholder:text-n-5 dark:focus:border-n-4"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="h-11 border-b border-n-2 bg-transparent px-0 text-sm text-n-6 outline-none transition placeholder:text-n-4 focus:border-n-4 dark:border-n-2 dark:text-n-6 dark:placeholder:text-n-5 dark:focus:border-n-4"
        />
      )}
    </label>
  );
}
