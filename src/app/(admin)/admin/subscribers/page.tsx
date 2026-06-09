import { SubscriberStatus } from "@prisma/client";
import Link from "next/link";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { LiveSearchInput } from "@/app/(admin)/admin/live-search-input";
import {
  activateSubscriberAction,
  unsubscribeSubscriberAction,
} from "@/app/(admin)/admin/subscribers/actions";
import {
  formatAdminDateTime,
  formatAdminNumber,
} from "@/app/(admin)/admin/utils";
import { isOwnerAuthenticated } from "@/server/auth";
import {
  getSubscriberStats,
  listSubscribersForAdmin,
  type SubscriberListItem,
} from "@/server/repositories/subscribers";

type AdminSubscribersSearchParams = Promise<{
  q?: string;
  status?: string;
}>;

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: AdminSubscribersSearchParams;
}) {
  const { q, status } = await searchParams;
  const query = q?.trim() ?? "";
  const activeProcessedStatus =
    status === SubscriberStatus.UNSUBSCRIBED
      ? SubscriberStatus.UNSUBSCRIBED
      : SubscriberStatus.ACTIVE;
  const [subscribers, stats, canManageSubscribers] = await Promise.all([
    listSubscribersForAdmin(),
    getSubscriberStats(),
    isOwnerAuthenticated(),
  ]);

  const matchedSubscribers = subscribers.filter((subscriber) =>
    matchesSubscriberQuery(subscriber, query),
  );
  const pendingSubscribers = matchedSubscribers.filter(
    (subscriber) => subscriber.status === SubscriberStatus.PENDING,
  );
  const activeSubscribers = matchedSubscribers.filter(
    (subscriber) => subscriber.status === SubscriberStatus.ACTIVE,
  );
  const unsubscribedSubscribers = matchedSubscribers.filter(
    (subscriber) => subscriber.status === SubscriberStatus.UNSUBSCRIBED,
  );
  const processedSubscribers =
    activeProcessedStatus === SubscriberStatus.ACTIVE
      ? activeSubscribers
      : unsubscribedSubscribers;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        {!canManageSubscribers ? (
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 dark:text-zinc-500">
            当前帐号不是 Owner，以下管理按钮仅展示为禁用态。
          </p>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">订阅者管理</p>
          </div>

          <LiveSearchInput defaultValue={query} placeholder="搜索邮箱或来源" />
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {query
            ? `找到 ${matchedSubscribers.length} 个匹配订阅者`
            : `当前共有 ${formatAdminNumber(stats.total)} 个订阅者，其中待确认 ${formatAdminNumber(stats.pending)} 个`}
        </p>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">待确认</h2>
        </div>

        {pendingSubscribers.length > 0 ? (
          <div className="grid gap-0">
            {pendingSubscribers.map((subscriber) => (
              <SubscriberRow
                key={subscriber.id}
                subscriber={subscriber}
                canManageSubscribers={canManageSubscribers}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel
            text={query ? "没有匹配的待确认订阅者。" : "当前没有待确认订阅者。"}
          />
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              已订阅 / 已退订
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "已订阅", value: SubscriberStatus.ACTIVE, count: stats.active },
              { label: "已退订", value: SubscriberStatus.UNSUBSCRIBED, count: stats.unsubscribed },
            ].map((item) => (
              <Link
                key={item.value}
                href={getSubscribersFilterHref(item.value, query)}
                className={[
                  "inline-flex h-9 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition",
                  item.value === activeProcessedStatus
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {item.label}
                <span
                  className={[
                    "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.68rem]",
                    item.value === activeProcessedStatus
                      ? "bg-white/80 text-primary dark:bg-white/10"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {formatAdminNumber(item.count)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {processedSubscribers.length > 0 ? (
          <div className="grid gap-0">
            {processedSubscribers.map((subscriber) => (
              <SubscriberRow
                key={subscriber.id}
                subscriber={subscriber}
                canManageSubscribers={canManageSubscribers}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel
            text={
              query
                ? activeProcessedStatus === SubscriberStatus.ACTIVE
                  ? "没有匹配的已订阅用户。"
                  : "没有匹配的已退订用户。"
                : activeProcessedStatus === SubscriberStatus.ACTIVE
                  ? "当前还没有已订阅用户。"
                  : "当前还没有已退订用户。"
            }
          />
        )}
      </section>
    </div>
  );
}

function SubscriberRow({
  subscriber,
  canManageSubscribers,
}: {
  subscriber: SubscriberListItem;
  canManageSubscribers: boolean;
}) {
  const meta = [
    subscriber.source ? `来源：${subscriber.source}` : null,
    getSubscriptionPreferenceLabel(subscriber),
    `创建于 ${formatAdminDateTime(subscriber.createdAt)}`,
    subscriber.confirmedAt ? `确认于 ${formatAdminDateTime(subscriber.confirmedAt)}` : null,
    subscriber.unsubscribedAt
      ? `退订于 ${formatAdminDateTime(subscriber.unsubscribedAt)}`
      : null,
  ].filter(Boolean);

  return (
    <article className="grid gap-4 border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 dark:border-zinc-800/80 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{subscriber.email}</p>
          <SubscriberStatusBadge status={subscriber.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {meta.map((item, index) => (
            <span key={`${subscriber.id}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 md:justify-end">
        {subscriber.status !== SubscriberStatus.ACTIVE ? (
          <form action={activateSubscriberAction}>
            <input type="hidden" name="subscriberId" value={subscriber.id} />
            <button
              type="submit"
              disabled={!canManageSubscribers}
              className="border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
            >
              设为已确认
            </button>
          </form>
        ) : null}

        {subscriber.status !== SubscriberStatus.UNSUBSCRIBED ? (
          <form action={unsubscribeSubscriberAction}>
            <input type="hidden" name="subscriberId" value={subscriber.id} />
            <button
              type="submit"
              disabled={!canManageSubscribers}
              className="border-b border-transparent px-0 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45 dark:text-rose-400 dark:hover:border-rose-900 dark:hover:text-rose-300"
            >
              取消订阅
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  const classes =
    status === SubscriberStatus.ACTIVE
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : status === SubscriberStatus.PENDING
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400";

  const label =
    status === SubscriberStatus.ACTIVE
      ? "已确认"
      : status === SubscriberStatus.PENDING
        ? "待确认"
        : "已退订";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>;
}

function matchesSubscriberQuery(subscriber: SubscriberListItem, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  return [
    subscriber.email,
    subscriber.source,
    subscriber.status,
    subscriber.subscribedToPosts ? "文章" : null,
    subscriber.subscribedToUpdates ? "动态" : null,
  ].some(
    (value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function getSubscribersFilterHref(
  status: typeof SubscriberStatus.ACTIVE | typeof SubscriberStatus.UNSUBSCRIBED,
  query: string,
) {
  const params = new URLSearchParams();

  params.set("status", status);

  if (query) {
    params.set("q", query);
  }

  const search = params.toString();
  return search ? `/admin/subscribers?${search}` : "/admin/subscribers";
}

function getSubscriptionPreferenceLabel(subscriber: SubscriberListItem) {
  const preferences = [
    subscriber.subscribedToPosts ? "文章" : null,
    subscriber.subscribedToUpdates ? "动态" : null,
  ].filter(Boolean);

  return preferences.length > 0 ? `订阅：${preferences.join(" / ")}` : "订阅：未选择";
}
