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
          <p className="site-eyebrow uppercase tracking-[0.22em] text-n-4">
            Subscription
          </p>
          <h1 className="site-title-page tracking-tight text-n-6">
            {title}
          </h1>
          <p className="site-body text-n-5">{description}</p>
        </div>

        <div className="site-meta flex flex-wrap gap-4">
          <Link
            href="/"
            className="btn btn-secondary h-10"
          >
            返回首页
          </Link>
          <Link
            href="/updates"
            className="btn btn-ghost h-10"
          >
            浏览内容
          </Link>
        </div>
      </section>
    </main>
  );
}
