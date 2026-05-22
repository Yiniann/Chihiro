"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveCommentSettingsAction,
  saveLoginSettingsAction,
  type SaveLoginCommentsSettingsState,
} from "@/app/(admin)/admin/settings/login-comments/actions";
import { useToast } from "@/components/toast-provider";
import type { PublicInteractionSettingsRecord } from "@/server/repositories/public-interactions";

const initialState: SaveLoginCommentsSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

type BaseSettingsFormProps = {
  defaults: PublicInteractionSettingsRecord;
};

type LoginSettingsFormProps = BaseSettingsFormProps & {
  authStatus: {
    authSecret: boolean;
    githubId: boolean;
    githubSecret: boolean;
    githubCallbackUrl: string;
    googleId: boolean;
    googleSecret: boolean;
    googleCallbackUrl: string;
  };
};

export function LoginSettingsForm({
  defaults,
  authStatus,
}: LoginSettingsFormProps) {
  const [state, formAction] = useActionState(saveLoginSettingsAction, initialState);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  useSettingsToast(state);
  const [watchedGithubLoginEnabled, setWatchedGithubLoginEnabled] = useState(
    defaults.githubLoginEnabled,
  );
  const [watchedGoogleLoginEnabled, setWatchedGoogleLoginEnabled] = useState(
    defaults.googleLoginEnabled,
  );
  const authSecretReady = defaults.hasAuthSecret || authStatus.authSecret;
  const githubClientIdReady = Boolean(defaults.githubClientId) || authStatus.githubId;
  const githubClientSecretReady = defaults.hasGithubClientSecret || authStatus.githubSecret;
  const githubReady = authSecretReady && githubClientIdReady && githubClientSecretReady;
  const googleClientIdReady = Boolean(defaults.googleClientId) || authStatus.googleId;
  const googleClientSecretReady =
    defaults.hasGoogleClientSecret || authStatus.googleSecret;
  const googleReady = authSecretReady && googleClientIdReady && googleClientSecretReady;

  async function updateLoginToggles(nextState: {
    github: boolean;
    google: boolean;
  }) {
    if (isSubmitting) {
      return;
    }

    const previousState = {
      github: watchedGithubLoginEnabled,
      google: watchedGoogleLoginEnabled,
    };
    setIsSubmitting(true);
    setWatchedGithubLoginEnabled(nextState.github);
    setWatchedGoogleLoginEnabled(nextState.google);

    const formData = new FormData();
    formData.set("githubLoginEnabled", nextState.github ? "true" : "false");
    formData.set("googleLoginEnabled", nextState.google ? "true" : "false");

    const result = await saveLoginSettingsAction(initialState, formData);

    if (result.error) {
      setWatchedGithubLoginEnabled(previousState.github);
      setWatchedGoogleLoginEnabled(previousState.google);
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success);
    }

    setIsSubmitting(false);
  }

  function handleGithubLoginEnabledChange(nextChecked: boolean) {
    void updateLoginToggles({
      github: nextChecked,
      google: watchedGoogleLoginEnabled,
    });
  }

  function handleGoogleLoginEnabledChange(nextChecked: boolean) {
    void updateLoginToggles({
      github: watchedGithubLoginEnabled,
      google: nextChecked,
    });
  }

  return (
    <form id="login-settings-form" action={formAction} className="grid gap-8">
      <input
        type="hidden"
        name="githubLoginEnabled"
        value={watchedGithubLoginEnabled ? "true" : "false"}
      />
      <input
        type="hidden"
        name="googleLoginEnabled"
        value={watchedGoogleLoginEnabled ? "true" : "false"}
      />
      <section className="grid gap-5">
        <div className="grid gap-5 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            会话安全
          </p>
          <AuthSecretField
            ready={authSecretReady}
            placeholder={authSecretReady ? "已保存；填写新值才会覆盖" : "粘贴或生成 Auth.js secret"}
          />
        </div>

        <div className="grid gap-5 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Google 登录
          </p>
          <SwitchField
            title="启用 Google 登录"
            description="允许访客使用 Google 登录。"
            checked={watchedGoogleLoginEnabled}
            onCheckedChange={handleGoogleLoginEnabledChange}
            disabled={isSubmitting}
          />
          {watchedGoogleLoginEnabled ? (
            <div className="grid gap-5 md:grid-cols-2">
              <OAuthField
                label="Google Client ID"
                ready={googleClientIdReady}
                statusLabel={googleClientIdReady ? "已配置" : "未配置"}
                name="googleClientId"
                type="text"
                defaultValue={defaults.googleClientId ?? ""}
                placeholder={authStatus.googleId ? "已通过环境变量配置" : "粘贴 Google OAuth Client ID"}
                description="来自 Google OAuth Client，用来识别当前站点。"
              />
              <OAuthField
                label="Google Client Secret"
                ready={googleClientSecretReady}
                statusLabel={googleClientSecretReady ? "已配置" : "未配置"}
                name="googleClientSecret"
                type="password"
                placeholder={googleClientSecretReady ? "已保存；填写新值才会覆盖" : "粘贴 Google OAuth Client Secret"}
                description="不会在页面回显；留空会保留已保存的值或继续使用环境变量。"
              />
              <div className="grid gap-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  Callback URL
                </span>
                <code className="w-fit rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {authStatus.googleCallbackUrl}
                </code>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            GitHub 登录
          </p>
          <SwitchField
            title="启用 GitHub 登录"
            description="允许访客使用 GitHub 登录。"
            checked={watchedGithubLoginEnabled}
            onCheckedChange={handleGithubLoginEnabledChange}
            disabled={isSubmitting}
          />
          {watchedGithubLoginEnabled ? (
            <div className="grid gap-5 md:grid-cols-2">
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
                  {authStatus.githubCallbackUrl}
                </code>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </form>
  );
}

export function CommentSettingsForm({
  defaults,
}: BaseSettingsFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [watchedCommentsEnabled, setWatchedCommentsEnabled] = useState(
    defaults.commentsEnabled,
  );
  const [watchedLoginRequiredToComment, setWatchedLoginRequiredToComment] = useState(
    defaults.loginRequiredToComment,
  );
  const [watchedCommentModeration, setWatchedCommentModeration] = useState(
    defaults.commentModeration,
  );

  async function submitCommentToggleUpdate(nextState: {
    commentsEnabled: boolean;
    loginRequiredToComment: boolean;
    commentModeration: boolean;
  }) {
    if (isSubmitting) {
      return;
    }

    const previousState = {
      commentsEnabled: watchedCommentsEnabled,
      loginRequiredToComment: watchedLoginRequiredToComment,
      commentModeration: watchedCommentModeration,
    };
    setIsSubmitting(true);
    setWatchedCommentsEnabled(nextState.commentsEnabled);
    setWatchedLoginRequiredToComment(nextState.loginRequiredToComment);
    setWatchedCommentModeration(nextState.commentModeration);

    const formData = new FormData();
    formData.set("commentsEnabled", nextState.commentsEnabled ? "true" : "false");
    formData.set(
      "loginRequiredToComment",
      nextState.loginRequiredToComment ? "true" : "false",
    );
    formData.set("commentModeration", nextState.commentModeration ? "true" : "false");

    const result = await saveCommentSettingsAction(initialState, formData);

    if (result.error) {
      setWatchedCommentsEnabled(previousState.commentsEnabled);
      setWatchedLoginRequiredToComment(previousState.loginRequiredToComment);
      setWatchedCommentModeration(previousState.commentModeration);
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success);
    }

    setIsSubmitting(false);
  }

  function handleCommentsEnabledChange(nextChecked: boolean) {
    void submitCommentToggleUpdate({
      commentsEnabled: nextChecked,
      loginRequiredToComment: watchedLoginRequiredToComment,
      commentModeration: watchedCommentModeration,
    });
  }

  function handleLoginRequiredToCommentChange(nextChecked: boolean) {
    void submitCommentToggleUpdate({
      commentsEnabled: watchedCommentsEnabled,
      loginRequiredToComment: nextChecked,
      commentModeration: watchedCommentModeration,
    });
  }

  function handleCommentModerationChange(nextChecked: boolean) {
    void submitCommentToggleUpdate({
      commentsEnabled: watchedCommentsEnabled,
      loginRequiredToComment: watchedLoginRequiredToComment,
      commentModeration: nextChecked,
    });
  }

  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <SwitchField
          title="启用评论"
          description="打开后文章页可以展示评论入口。"
          checked={watchedCommentsEnabled}
          onCheckedChange={handleCommentsEnabledChange}
          disabled={isSubmitting}
        />
        {watchedCommentsEnabled ? (
          <div className="grid gap-3 md:grid-cols-2">
            <SwitchField
              title="登录后才能评论"
              description="建议开启，避免匿名垃圾评论。"
              checked={watchedLoginRequiredToComment}
              onCheckedChange={handleLoginRequiredToCommentChange}
              disabled={isSubmitting}
            />
            <SwitchField
              title="评论需要审核"
              description="建议开启，审核通过后再公开展示。"
              checked={watchedCommentModeration}
              onCheckedChange={handleCommentModerationChange}
              disabled={isSubmitting}
            />
          </div>
        ) : null}
      </div>
    </section>
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

function useSettingsToast(state: SaveLoginCommentsSettingsState) {
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
    }
  }, [showToast, state.error, state.nonce, state.success]);
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
  title,
  description,
  defaultChecked,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const [internalChecked, setInternalChecked] = useState(Boolean(defaultChecked));
  const isControlled = typeof checked === "boolean";
  const isChecked = isControlled ? checked : internalChecked;

  function handleToggle() {
    if (disabled) {
      return;
    }

    const nextChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onCheckedChange?.(nextChecked);
  }

  return (
    <div
      className={`grid w-fit max-w-xl gap-2 border-b border-zinc-200/80 pb-5 pr-4 dark:border-zinc-800/80 ${
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"
      }`}
    >
      <span className="flex w-fit items-center gap-3">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-label={title}
          onClick={handleToggle}
          disabled={disabled}
          className="relative inline-flex h-5 w-9 shrink-0 items-center"
        >
          <span
            className={`absolute inset-0 rounded-full transition ${
              isChecked ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
          <span
            className={`relative size-4 rounded-full bg-white shadow-sm transition-transform ${
              isChecked ? "translate-x-[1.125rem]" : "translate-x-0.5"
            }`}
          />
        </button>
      </span>
      <span className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">{description}</span>
    </div>
  );
}
