"use client";

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
  const githubReady = authStatus.authSecret && authStatus.githubId && authStatus.githubSecret;

  return (
    <form action={formAction} className="grid gap-8">
      <section className="grid gap-5">
        <div className="border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            GitHub OAuth
          </p>
          <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <StatusRow label="AUTH_SECRET" ready={authStatus.authSecret} />
            <StatusRow label="AUTH_GITHUB_ID" ready={authStatus.githubId} />
            <StatusRow label="AUTH_GITHUB_SECRET" ready={authStatus.githubSecret} />
          </div>
          <div className="mt-5 grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Callback URL
            </span>
            <code className="w-fit rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {authStatus.callbackUrl}
            </code>
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            OAuth 密钥通过环境变量配置；这里仅检测状态，不在后台保存 secret。
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SwitchField
            name="githubLoginEnabled"
            title="启用 GitHub 登录"
            description={githubReady ? "允许访客使用 GitHub 登录。" : "环境变量未完整配置时，登录入口不会真正可用。"}
            defaultChecked={defaults.githubLoginEnabled}
          />
          <SwitchField
            name="googleLoginEnabled"
            title="启用 Google 登录"
            description="先保留 UI；Google OAuth 还没有接入。"
            defaultChecked={defaults.googleLoginEnabled}
            disabled
          />
        </div>
      </section>

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

function StatusRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-200/70 py-2 dark:border-zinc-800/70">
      <span className="font-mono text-xs">{label}</span>
      <span className={ready ? "text-xs font-medium text-emerald-600 dark:text-emerald-300" : "text-xs font-medium text-zinc-400"}>
        {ready ? "已配置" : "未配置"}
      </span>
    </div>
  );
}

function SwitchField({
  name,
  title,
  description,
  defaultChecked,
  disabled = false,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={`grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80 ${
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"
      }`}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <input
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          disabled={disabled}
          className="h-4 w-4 accent-primary"
        />
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
