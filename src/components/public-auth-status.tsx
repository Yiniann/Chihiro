"use client";

import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { signOutPublicUserAction } from "@/app/(site)/auth/actions";

type PublicAuthStatusProps = {
  siteUrl: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  variant?: "default" | "comment";
};

export function PublicAuthStatus({ siteUrl, user, variant = "default" }: PublicAuthStatusProps) {
  if (!user) {
    return <PublicSignInForm siteUrl={siteUrl} variant={variant} />;
  }

  return (
    <div className="flex items-center gap-3">
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-full"
        />
      ) : null}
      <span className="min-w-0 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {user.name ?? user.email ?? "已登录"}
      </span>
      <form action={signOutPublicUserAction}>
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
}: {
  siteUrl: string;
  variant: "default" | "comment";
}) {
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const isCommentVariant = variant === "comment";

  async function handleSignIn() {
    setError(null);

    try {
      await signIn("github", {
        callbackUrl: new URL(pathname, siteUrl).toString(),
      });
    } catch {
      setError("GitHub 登录配置有问题，请检查 Client ID、Client Secret 和 callback URL。");
    }
  }

  return (
    <div className={isCommentVariant ? "grid gap-2 justify-items-center" : "grid gap-2 justify-items-start"}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleSignIn}
          className="inline-flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 hover:opacity-90"
          title="使用 GitHub 登录"
        >
          <GithubMark className="size-5" aria-hidden="true" />
          <span className="sr-only">使用 GitHub 登录</span>
        </button>
        {process.env.NODE_ENV !== "production" ? (
          <a
            href={`/api/dev/public-login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <LogIn className="size-4" aria-hidden="true" />
            <span>开发登录</span>
          </a>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
      ) : null}
    </div>
  );
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      focusable="false"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.72.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.15 10.15 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
