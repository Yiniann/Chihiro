import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import {
  signInWithGitHubAction,
  signOutPublicUserAction,
} from "@/app/(site)/auth/actions";
import { auth } from "@/server/public-auth";

export async function PublicAuthStatus() {
  const session = await auth();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <form action={signInWithGitHubAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-primary/10 hover:text-primary dark:text-zinc-300"
        >
          <LogIn className="size-4" aria-hidden="true" />
          <span>使用 GitHub 登录</span>
        </button>
      </form>
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
