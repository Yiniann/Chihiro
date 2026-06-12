import Link from "next/link";
import { unsubscribeSubscriberByToken } from "@/server/repositories/subscribers";

type UnsubscribeSearchParams = Promise<{
  token?: string;
}>;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: UnsubscribeSearchParams;
}) {
  const { token } = await searchParams;
  const normalizedToken = token?.trim() ?? "";

  let title = "退订链接无效";
  let description = "这个退订链接不可用，可能已经失效或填写不完整。";

  if (normalizedToken) {
    const subscriber = await unsubscribeSubscriberByToken(normalizedToken);

    if (subscriber) {
      title = "你已退订";
      description = "这个邮箱不会再收到新的订阅通知。如果以后想重新订阅，可以回到站点再次提交邮箱。";
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-2xl items-center px-6 py-16 sm:px-10">
      <section className="grid gap-5">
        <div className="grid gap-2">
          <p className="site-eyebrow uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Subscription
          </p>
          <h1 className="site-title-page tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="site-body text-zinc-600 dark:text-zinc-300">{description}</p>
        </div>

        <div className="site-meta flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-100 dark:hover:text-zinc-50"
          >
            返回首页
          </Link>
          <Link
            href="/updates"
            className="inline-flex h-10 items-center justify-center px-1 text-zinc-500 underline underline-offset-4 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            浏览内容
          </Link>
        </div>
      </section>
    </main>
  );
}
