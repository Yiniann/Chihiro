"use client";

import { LogOut, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOutSiteUserAction } from "@/app/(site)/auth/actions";
import { AuthProviderBadge, GithubMark, GoogleMark } from "@/components/auth-provider-badge";
import { PublicAuthDialog } from "@/components/public-auth-dialog";

type PublicAuthStatusProps = {
  siteUrl: string;
  githubEnabled?: boolean;
  googleEnabled?: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: "github" | "google" | "credentials" | null;
  } | null;
  variant?: "default" | "comment";
};

export function PublicAuthStatus({
  siteUrl,
  githubEnabled = true,
  googleEnabled = false,
  user,
  variant = "default",
}: PublicAuthStatusProps) {
  if (!user) {
    return (
      <PublicSignInForm
        siteUrl={siteUrl}
        variant={variant}
        githubEnabled={githubEnabled}
        googleEnabled={googleEnabled}
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="relative block size-7 shrink-0">
        {user.image ? (
          <span
            className="block size-7 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
            style={{ backgroundImage: `url(${user.image})` }}
          />
        ) : (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {(user.name ?? user.email ?? "你").slice(0, 1).toUpperCase()}
          </span>
        )}
        <AuthProviderBadge provider={user.provider ?? null} className="size-3.5" />
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {user.name ?? user.email ?? "已登录"}
      </span>
      <form action={signOutSiteUserAction}>
        <button
          type="submit"
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="sr-only">退出登录</span>
        </button>
      </form>
    </div>
  );
}

function PublicSignInForm({
  siteUrl,
  variant,
  githubEnabled,
  googleEnabled,
}: {
  siteUrl: string;
  variant: "default" | "comment";
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isCommentVariant = variant === "comment";

  async function handleProviderSignIn(provider: "github" | "google") {
    await signIn(provider, {
      callbackUrl: new URL(pathname, siteUrl).toString(),
    });
  }

  if (isCommentVariant) {
    return (
      <div className="grid gap-2 justify-items-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {googleEnabled ? (
            <button
              type="button"
              onClick={() => void handleProviderSignIn("google")}
              className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200/80 text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              title="Google 登录"
              aria-label="Google 登录"
            >
              <GoogleMark className="size-4" />
            </button>
          ) : null}
          {githubEnabled ? (
            <button
              type="button"
              onClick={() => void handleProviderSignIn("github")}
              className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200/80 text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              title="GitHub 登录"
              aria-label="GitHub 登录"
            >
              <GithubMark className="size-4" />
            </button>
          ) : null}
          {!googleEnabled && !githubEnabled ? (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">登录方式尚未配置</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 justify-items-start">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 hover:opacity-90"
          title="登录"
        >
          <UserRound className="size-4" aria-hidden="true" />
          <span className="sr-only">登录</span>
        </button>
      </div>
      <PublicAuthDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        siteUrl={siteUrl}
        callbackPath={pathname}
        githubEnabled={githubEnabled}
        googleEnabled={googleEnabled}
      />
    </div>
  );
}
