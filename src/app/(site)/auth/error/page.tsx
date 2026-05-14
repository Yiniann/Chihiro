import Link from "next/link";
import { ClearLinkIntent } from "@/app/(site)/auth/error/clear-link-intent";

type AuthErrorPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const ERROR_COPY: Record<string, { title: string; description: string }> = {
  OAuthAccountNotLinked: {
    title: "绑定失败",
    description:
      "这个第三方帐号已经绑定到别的用户了。请先用原来的帐号登录，或者先处理旧帐号的合并关系。",
  },
  AccessDenied: {
    title: "登录被拒绝",
    description: "这次登录没有完成授权，或者当前帐号没有被允许使用这个登录方式。",
  },
  Callback: {
    title: "登录回调失败",
    description: "第三方登录在回调阶段没有完成，稍后再试一次通常就可以恢复。",
  },
  OAuthCallbackError: {
    title: "第三方登录失败",
    description: "OAuth 回调没有成功完成，请检查回调地址和第三方应用配置。",
  },
  OAuthSignin: {
    title: "无法发起第三方登录",
    description: "认证请求没有成功发出，请检查当前的 OAuth 配置。",
  },
  AccountLinkIntentRequired: {
    title: "请从绑定页发起",
    description:
      "当前登录状态下，普通 OAuth 登录不会自动绑定。请前往后台“用户与权限”页面，再主动发起绑定。",
  },
  AccountLinkSigninRequired: {
    title: "请先登录",
    description: "绑定第三方登录前，先用你的本地 Owner 帐号登录后台。",
  },
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorCode = params?.error ?? "";
  const copy = ERROR_COPY[errorCode] ?? {
    title: "登录没有完成",
    description: "认证流程中断了，请返回首页后再试一次。",
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-2xl items-center px-6 py-16">
      <ClearLinkIntent />
      <section className="w-full rounded-[2rem] border border-zinc-200/80 bg-white/80 p-8 shadow-[0_20px_70px_rgba(24,24,27,0.08)] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          Auth
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {copy.description}
        </p>
        {errorCode ? (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">错误代码: {errorCode}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            返回首页
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200/80 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            前往后台
          </Link>
        </div>
      </section>
    </main>
  );
}
