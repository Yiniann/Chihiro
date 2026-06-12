import Link from "next/link";
import { confirmSubscriberByToken } from "@/server/repositories/subscribers";

type ConfirmSubscriptionSearchParams = Promise<{
  token?: string;
}>;

export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: ConfirmSubscriptionSearchParams;
}) {
  const { token } = await searchParams;
  const normalizedToken = token?.trim() ?? "";

  let title = "确认链接无效";
  let description = "这个订阅确认链接不可用，可能已经失效或填写不完整。";

  if (normalizedToken) {
    const subscriber = await confirmSubscriberByToken(normalizedToken);

    if (subscriber) {
      title = "订阅已确认";
      description = "之后有新的动态发布时，我们会把通知发送到你的邮箱。";
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

        <div className="site-meta flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-base font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-zinc-50"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
