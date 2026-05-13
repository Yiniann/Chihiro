"use client";

import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOutSiteUserAction } from "@/app/(site)/auth/actions";
import { PublicAuthDialog } from "@/components/public-auth-dialog";

type PublicAuthStatusProps = {
  siteUrl: string;
  githubEnabled?: boolean;
  googleEnabled?: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
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

  return (
    <div className={isCommentVariant ? "grid gap-2 justify-items-center" : "grid gap-2 justify-items-start"}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 hover:opacity-90"
          title="登录"
        >
          <LogIn className="size-4" aria-hidden="true" />
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
