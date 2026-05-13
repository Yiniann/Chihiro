"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import {
  saveLoginCommentsSettingsAction,
  type SaveLoginCommentsSettingsState,
} from "@/app/(admin)/admin/settings/login-comments/actions";
import type { PublicInteractionSettingsRecord } from "@/server/repositories/public-interactions";

const initialState: SaveLoginCommentsSettingsState = {
  error: null,
  success: null,
};

type LoginCommentsSettingsFormProps = {
  defaults: PublicInteractionSettingsRecord;
  authStatus: {
    authSecret: boolean;
    githubId: boolean;
    githubSecret: boolean;
    callbackUrl: string;
  };
};

export function LoginCommentsSettingsForm({
  defaults,
  authStatus,
}: LoginCommentsSettingsFormProps) {
  const [state, formAction] = useActionState(saveLoginCommentsSettingsAction, initialState);
  const [watchedGithubLoginEnabled, setWatchedGithubLoginEnabled] = useState(
    defaults.githubLoginEnabled,
  );
  const authSecretReady = defaults.hasAuthSecret || authStatus.authSecret;
  const githubClientIdReady = Boolean(defaults.githubClientId) || authStatus.githubId;
  const githubClientSecretReady = defaults.hasGithubClientSecret || authStatus.githubSecret;
  const githubReady = authSecretReady && githubClientIdReady && githubClientSecretReady;

  return (
    <form action={formAction} className="grid gap-8">
      <section className="grid gap-3 md:grid-cols-3">
        <SwitchField
          name="commentsEnabled"
          title="启用评论"
          description="打开后文章页可以展示评论入口。"
          defaultChecked={defaults.commentsEnabled}
        />
        <SwitchField
          name="loginRequiredToComment"
          title="登录后才能评论"
          description="建议开启，避免匿名垃圾评论。"
          defaultChecked={defaults.loginRequiredToComment}
        />
        <SwitchField
          name="commentModeration"
          title="评论需要审核"
          description="建议开启，审核通过后再公开展示。"
          defaultChecked={defaults.commentModeration}
        />
      </section>

      <section className="grid gap-5">
        <div className="grid gap-5 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            GitHub 登录
          </p>
          <SwitchField
            name="githubLoginEnabled"
            title="启用 GitHub 登录"
            description={githubReady ? "允许访客使用 GitHub 登录。" : "OAuth 配置未完整时，登录入口不会真正可用。"}
            defaultChecked={defaults.githubLoginEnabled}
            onCheckedChange={setWatchedGithubLoginEnabled}
          />
          {watchedGithubLoginEnabled ? (
            <div className="grid gap-5 md:grid-cols-2">
              <AuthSecretField
                ready={authSecretReady}
                placeholder={authSecretReady ? "已保存；填写新值才会覆盖" : "粘贴或生成 Auth.js secret"}
              />
              <OAuthField
                label="GitHub Client ID"
                ready={githubClientIdReady}
                statusLabel={githubClientIdReady ? "已配置" : "未配置"}
                name="githubClientId"
                type="text"
                defaultValue={defaults.githubClientId ?? ""}
                placeholder={authStatus.githubId ? "已通过环境变量配置" : "粘贴 GitHub OAuth Client ID"}
                description="来自 GitHub OAuth App，用来识别当前站点。"
              />
              <OAuthField
                label="GitHub Client Secret"
                ready={githubClientSecretReady}
                statusLabel={githubClientSecretReady ? "已配置" : "未配置"}
                name="githubClientSecret"
                type="password"
                placeholder={githubClientSecretReady ? "已保存；填写新值才会覆盖" : "粘贴 GitHub OAuth Client Secret"}
                description="不会在页面回显；留空会保留已保存的值或继续使用环境变量。"
              />
              <div className="grid gap-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  Callback URL
                </span>
                <code className="w-fit rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {authStatus.callbackUrl}
                </code>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Google 登录
          </p>
          <SwitchField
            name="googleLoginEnabled"
            title="启用 Google 登录"
            description="先保留 UI；Google OAuth 还没有接入。"
            defaultChecked={defaults.googleLoginEnabled}
            disabled
          />
        </div>
      </section>

      <section className="grid gap-3">
        {state.error ? <EmptyPanel text={state.error} /> : null}
        {state.success ? (
          <div className="border border-emerald-200/80 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-300">
            {state.success}
          </div>
        ) : null}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800/70 dark:bg-zinc-950/75 supports-[backdrop-filter]:dark:bg-zinc-950/65">
          <div className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
            这些设置会影响后续文章评论入口和公开用户登录体验。
          </div>
          <SaveButton />
        </div>
      </section>
    </form>
  );
}

function OAuthField({
  label,
  ready,
  statusLabel,
  name,
  type,
  placeholder,
  description,
  defaultValue,
  className = "",
}: {
  label: string;
  ready: boolean;
  statusLabel: string;
  name: string;
  type: "password" | "text";
  placeholder: string;
  description: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80 ${className}`}>
      <span className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
        <span
          className={
            ready
              ? "text-xs font-medium text-emerald-600 dark:text-emerald-300"
              : "text-xs font-medium text-zinc-400"
          }
        >
          {statusLabel}
        </span>
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
      />
      <span className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">{description}</span>
    </label>
  );
}

function AuthSecretField({
  ready,
  placeholder,
}: {
  ready: boolean;
  placeholder: string;
}) {
  const [generatedSecret, setGeneratedSecret] = useState("");

  function handleGenerateSecret() {
    if (
      (ready || generatedSecret) &&
      !window.confirm("重新生成 AUTH_SECRET 会让现有公开用户登录会话失效。确定要继续吗？")
    ) {
      return;
    }

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const secret = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    setGeneratedSecret(secret);
  }

  return (
    <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80 md:col-span-2">
      <span className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          AUTH_SECRET
        </span>
        <span
          className={
            ready
              ? "text-xs font-medium text-emerald-600 dark:text-emerald-300"
              : "text-xs font-medium text-zinc-400"
          }
        >
          {ready ? "已配置" : "未配置"}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <input
          name="authSecret"
          type="password"
          value={generatedSecret}
          onChange={(event) => setGeneratedSecret(event.target.value)}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={handleGenerateSecret}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-200/80 px-3 text-sm font-medium text-zinc-600 transition hover:border-primary/40 hover:text-primary dark:border-zinc-800 dark:text-zinc-300"
        >
          {ready || generatedSecret ? "重新生成" : "生成"}
        </button>
      </span>
      <span className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        用于签名和加密登录会话；点击生成会创建一个随机 secret，保存后生效。
      </span>
    </label>
  );
}

function SwitchField({
  name,
  title,
  description,
  defaultChecked,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const checkboxProps =
    typeof checked === "boolean"
      ? {
          checked,
          onChange: onCheckedChange
            ? (event: ChangeEvent<HTMLInputElement>) => onCheckedChange(event.target.checked)
            : undefined,
        }
      : {
          defaultChecked: Boolean(defaultChecked),
          onChange: onCheckedChange
            ? (event: ChangeEvent<HTMLInputElement>) => onCheckedChange(event.target.checked)
            : undefined,
        };

  return (
    <label
      className={`grid w-fit max-w-xl gap-2 border-b border-zinc-200/80 pb-5 pr-4 dark:border-zinc-800/80 ${
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"
      }`}
    >
      <span className="flex w-fit items-center gap-3">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            name={name}
            type="checkbox"
            disabled={disabled}
            className="peer absolute inset-0 opacity-0"
            {...checkboxProps}
          />
          <span className="absolute inset-0 rounded-full bg-zinc-200 transition peer-checked:bg-primary dark:bg-zinc-800" />
          <span className="relative size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[1.125rem]" />
        </span>
      </span>
      <span className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">{description}</span>
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center border border-transparent bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? "保存中..." : "保存设置"}
    </button>
  );
}
