"use client";

import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActionState } from "react";
import {
  signInWithGitHubAction,
  signOutPublicUserAction,
  type PublicSignInState,
} from "@/app/(site)/auth/actions";

const initialState: PublicSignInState = {
  error: null,
};

type PublicAuthStatusProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function PublicAuthStatus({ user }: PublicAuthStatusProps) {
  if (!user) {
    return <PublicSignInForm />;
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

function PublicSignInForm() {
  const pathname = usePathname();
  const [state, formAction] = useActionState(signInWithGitHubAction, initialState);

  return (
    <form action={formAction} className="grid gap-2 justify-items-start">
      <input type="hidden" name="callbackUrl" value={pathname} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-primary/10 hover:text-primary dark:text-zinc-300"
      >
        <LogIn className="size-4" aria-hidden="true" />
        <span>使用 GitHub 登录</span>
      </button>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-300">{state.error}</p>
      ) : null}
    </form>
  );
}
