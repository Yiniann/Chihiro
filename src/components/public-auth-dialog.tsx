"use client";

import { KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { FormEvent } from "react";
import { DialogShell } from "@/components/dialog-shell";
import { useToast } from "@/components/toast-provider";
import { useDialogShake } from "@/components/use-dialog-shake";

type PublicAuthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
  callbackPath: string;
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function PublicAuthDialog({
  isOpen,
  onClose,
  siteUrl,
  callbackPath,
  githubEnabled,
  googleEnabled,
}: PublicAuthDialogProps) {
  const [passwordLoginOpen, setPasswordLoginOpen] = useState(false);
  const { showToast } = useToast();
  const { shakeControls, triggerShake } = useDialogShake();
  const handleClose = () => {
    setPasswordLoginOpen(false);
    onClose();
  };

  async function handleProviderSignIn(provider: "github" | "google") {
    try {
      await signIn(provider, {
        callbackUrl: new URL(callbackPath, siteUrl).toString(),
      });
    } catch {
      showToast("登录配置有问题，请检查 OAuth Client ID、Client Secret 和 callback URL。", "error");
    }
  }

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      title="选择登录方式"
      eyebrow="Sign in"
      maxWidthClassName="max-w-sm"
      panelClassName=""
      overlayClassName="!bg-transparent !backdrop-blur-none dark:!bg-transparent"
      closeOnOverlayClick={false}
      onOverlayClick={triggerShake}
      panelAnimationControls={shakeControls}
      lockBodyScroll={false}
    >
      {passwordLoginOpen ? (
        <PasswordLoginForm
          siteUrl={siteUrl}
          callbackPath={callbackPath}
          onBack={() => setPasswordLoginOpen(false)}
        />
      ) : (
        <>
          <div className="mt-1 grid gap-2">
            <ProviderButton
              label="Google"
              enabled={googleEnabled}
              disabledText="Google 登录尚未配置"
              icon={<GoogleMark className="size-5" />}
              onClick={() => handleProviderSignIn("google")}
            />
            <ProviderButton
              label="GitHub"
              enabled={githubEnabled}
              disabledText="GitHub 登录尚未配置"
              icon={<GithubMark className="size-5" />}
              onClick={() => handleProviderSignIn("github")}
            />
            {process.env.NODE_ENV !== "production" ? (
              <a
                href={`/api/dev/public-login?next=${encodeURIComponent(callbackPath)}`}
                className="btn btn-secondary h-12 justify-start gap-3"
              >
                <UserRound className="size-5" aria-hidden="true" />
                <span>开发登录</span>
              </a>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setPasswordLoginOpen(true)}
            className="btn btn-ghost mt-4 h-10 w-full"
          >
            使用帐号密码登录
          </button>
        </>
      )}
    </DialogShell>
  );
}

function PasswordLoginForm({
  siteUrl,
  callbackPath,
  onBack,
}: {
  siteUrl: string;
  callbackPath: string;
  onBack: () => void;
}) {
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);

    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const result = await signIn("credentials", {
        username: typeof username === "string" ? username : "",
        password: typeof password === "string" ? password : "",
        redirect: false,
        callbackUrl: new URL(callbackPath, siteUrl).toString(),
      });

      if (!result || result.error) {
        showToast("帐号或密码不正确。", "error");
        return;
      }

      window.location.href = result.url ?? callbackPath;
    } catch {
      showToast("密码登录失败，请稍后再试。", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        await handleSubmit(formData);
      }}
      className="mt-5 grid gap-3"
    >
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-n-5">帐号</span>
        <div className="field-line">
          <UserRound className="size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          <input
            type="text"
            name="username"
            autoComplete="username"
            disabled={pending}
            className="field-line-input disabled:cursor-not-allowed"
            placeholder="输入帐号"
          />
        </div>
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-n-5">密码</span>
        <div className="field-line">
          <KeyRound className="size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            disabled={pending}
            className="field-line-input disabled:cursor-not-allowed"
            placeholder="输入密码"
          />
        </div>
      </label>
      <PasswordSubmitButton pending={pending} />
      <button
        type="button"
        onClick={onBack}
        disabled={pending}
        className="btn btn-ghost h-10"
      >
        返回一键登录
      </button>
    </form>
  );
}

function PasswordSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary h-10 gap-2"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
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
      className="btn btn-secondary h-12 justify-between gap-3 disabled:opacity-45"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>
      {!enabled ? <span className="text-xs font-normal text-n-4">{disabledText}</span> : null}
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
