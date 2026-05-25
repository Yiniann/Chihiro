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
  const activeStatus = getStatusFilter(status);
  const [subscribers, stats, canManageSubscribers] = await Promise.all([
    listSubscribersForAdmin(),
    getSubscriberStats(),
    isOwnerAuthenticated(),
  ]);

  const filteredSubscribers = subscribers
    .filter((subscriber) =>
      activeStatus === "all" ? true : subscriber.status === activeStatus,
    )
    .filter((subscriber) => matchesSubscriberQuery(subscriber, query));

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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              这里管理邮件订阅者，而不是登录读者。只有 `ACTIVE` 状态的邮箱会成为后续邮件通知目标。
            </p>
          </div>

          <LiveSearchInput defaultValue={query} placeholder="搜索邮箱或来源" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "全部", value: "all" as const, count: stats.total },
            { label: "已确认", value: SubscriberStatus.ACTIVE, count: stats.active },
            { label: "待确认", value: SubscriberStatus.PENDING, count: stats.pending },
            { label: "已退订", value: SubscriberStatus.UNSUBSCRIBED, count: stats.unsubscribed },
          ].map((item) => {
            const isActive =
              activeStatus === item.value ||
              (item.value === "all" && activeStatus === "all");

            return (
              <Link
                key={item.value}
                href={getSubscribersFilterHref(item.value, query)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                  isActive
                    ? "border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-50"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                <span>{item.label}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatAdminNumber(item.count)}
                </span>
              </Link>
            );
          })}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {query
            ? `找到 ${filteredSubscribers.length} 个匹配订阅者`
            : `当前筛选 ${getStatusLabel(activeStatus)}，共 ${filteredSubscribers.length} 个订阅者`}
        </p>
      </section>

      {filteredSubscribers.length > 0 ? (
        <section className="grid gap-0">
          {filteredSubscribers.map((subscriber) => (
            <SubscriberRow
              key={subscriber.id}
              subscriber={subscriber}
              canManageSubscribers={canManageSubscribers}
            />
          ))}
        </section>
      ) : (
        <EmptyPanel
          text={
            query
              ? "没有找到匹配的订阅者。换个关键词试试。"
              : "还没有订阅者。等前台有人提交邮箱并完成确认后，这里就会出现。"
          }
        />
      )}
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

function getStatusFilter(value: string | undefined) {
  if (
    value === SubscriberStatus.ACTIVE ||
    value === SubscriberStatus.PENDING ||
    value === SubscriberStatus.UNSUBSCRIBED
  ) {
    return value;
  }

  return "all" as const;
}

function getStatusLabel(value: ReturnType<typeof getStatusFilter>) {
  if (value === SubscriberStatus.ACTIVE) {
    return "已确认";
  }

  if (value === SubscriberStatus.PENDING) {
    return "待确认";
  }

  if (value === SubscriberStatus.UNSUBSCRIBED) {
    return "已退订";
  }

  return "全部";
}

function getSubscribersFilterHref(
  status: ReturnType<typeof getStatusFilter>,
  query: string,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

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
