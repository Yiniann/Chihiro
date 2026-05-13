"use client";

import { LogIn, X } from "lucide-react";
import { signIn } from "next-auth/react";
import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { loginAction, type AdminLoginState } from "@/app/(admin)/admin/login/actions";

type PublicAuthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
  callbackPath: string;
  githubEnabled: boolean;
  googleEnabled: boolean;
  adminNext?: string | null;
};

export function PublicAuthDialog({
  isOpen,
  onClose,
  siteUrl,
  callbackPath,
  githubEnabled,
  googleEnabled,
  adminNext = null,
}: PublicAuthDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [passwordLoginOpen, setPasswordLoginOpen] = useState(false);
  const handleClose = useCallback(() => {
    setError(null);
    setPasswordLoginOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  async function handleProviderSignIn(provider: "github" | "google") {
    setError(null);

    try {
      await signIn(provider, {
        callbackUrl: new URL(callbackPath, siteUrl).toString(),
      });
    } catch {
      setError("登录配置有问题，请检查 OAuth Client ID、Client Secret 和 callback URL。");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/35 backdrop-blur-md dark:bg-black/60"
      onClick={handleClose}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-10 sm:px-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-auth-dialog-title"
          className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={handleClose}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
              Sign in
            </p>
            <h2
              id="public-auth-dialog-title"
              className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              选择登录方式
            </h2>
          </div>

          {passwordLoginOpen && adminNext ? (
            <PasswordLoginForm next={adminNext} onBack={() => setPasswordLoginOpen(false)} />
          ) : (
            <>
              <div className="mt-5 grid gap-2">
                <ProviderButton
                  label="GitHub"
                  enabled={githubEnabled}
                  disabledText="GitHub 登录尚未配置"
                  icon={<GithubMark className="size-5" />}
                  onClick={() => handleProviderSignIn("github")}
                />
                <ProviderButton
                  label="Google"
                  enabled={googleEnabled}
                  disabledText="Google 登录稍后接入"
                  icon={<GoogleMark className="size-5" />}
                  onClick={() => handleProviderSignIn("google")}
                />
                {process.env.NODE_ENV !== "production" ? (
                  <a
                    href={`/api/dev/public-login?next=${encodeURIComponent(callbackPath)}`}
                    className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-200/80 px-4 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  >
                    <LogIn className="size-5" aria-hidden="true" />
                    <span>开发登录</span>
                  </a>
                ) : null}
              </div>

              {adminNext ? (
                <button
                  type="button"
                  onClick={() => setPasswordLoginOpen(true)}
                  className="mt-4 w-full text-center text-xs font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  使用帐号密码登录
                </button>
              ) : null}
            </>
          )}

          {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const initialAdminLoginState: AdminLoginState = {
  error: null,
};

function PasswordLoginForm({ next, onBack }: { next: string; onBack: () => void }) {
  const [state, formAction] = useActionState(loginAction, initialAdminLoginState);

  return (
    <form action={formAction} className="mt-5 grid gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">帐号</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          className="h-10 rounded-2xl border border-zinc-200/80 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-primary/40 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-100"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">密码</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="h-10 rounded-2xl border border-zinc-200/80 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-primary/40 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-100"
        />
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          {state.error}
        </p>
      ) : null}
      <PasswordSubmitButton />
      <button
        type="button"
        onClick={onBack}
        className="text-center text-xs font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        返回一键登录
      </button>
    </form>
  );
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "登录中..." : "密码登录"}
    </button>
  );
}

function ProviderButton({
  label,
  enabled,
  disabledText,
  icon,
  onClick,
}: {
  label: string;
  enabled: boolean;
  disabledText: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>
      {!enabled ? <span className="text-xs font-normal text-zinc-400">{disabledText}</span> : null}
    </button>
  );
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" focusable="false">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.72.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.15 10.15 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.43Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.34l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.98A6 6 0 0 1 6.1 12c0-.69.11-1.36.31-1.98V7.43H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.57l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.9c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.91 14.69 2 12 2a9.99 9.99 0 0 0-8.93 5.43l3.34 2.59C7.2 7.66 9.4 5.9 12 5.9Z" />
    </svg>
  );
}
