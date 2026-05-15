import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import {
  formatAdminDateTime,
  formatAdminNumber,
  getContentWordCount,
  getRecentItems,
  getSiteRuntimeDays,
} from "@/app/(admin)/admin/utils";
import { listPostCategories } from "@/server/repositories/categories";
import { getCommentStatsForAdmin } from "@/server/repositories/comments";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { auth } from "@/server/public-auth";
import { getSiteCreatedAt, getSiteSettings } from "@/server/repositories/site";
import { listUpdatesForAdmin } from "@/server/repositories/updates";

export default async function AdminOverviewPage() {
  const [session, posts, updates, siteCreatedAt, siteSettings, commentStats, postCategories] =
    await Promise.all([
      auth(),
      listPostsForAdmin(),
      listUpdatesForAdmin(),
      getSiteCreatedAt(),
      getSiteSettings(),
      getCommentStatsForAdmin(),
      listPostCategories(),
    ]);

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    siteSettings?.authorName?.trim() ||
    "管理员";
  const siteName = siteSettings?.siteName?.trim() || "博客";
  const visiblePosts = posts.filter((item) => item.status !== ContentStatus.ARCHIVED);
  const visibleUpdates = updates.filter((item) => item.status !== ContentStatus.ARCHIVED);
  const publishedPosts = visiblePosts.filter((item) => item.status === ContentStatus.PUBLISHED);
  const publishedUpdates = visibleUpdates.filter((item) => item.status === ContentStatus.PUBLISHED);
  const draftPosts = visiblePosts.length - publishedPosts.length;
  const draftUpdates = visibleUpdates.length - publishedUpdates.length;
  const revisedPublishedPosts = visiblePosts.filter(
    (item) => item.status === ContentStatus.PUBLISHED && item.draftSnapshot,
  ).length;
  const revisedPublishedUpdates = visibleUpdates.filter(
    (item) => item.status === ContentStatus.PUBLISHED && item.draftSnapshot,
  ).length;
  const recentItems = getRecentItems(visiblePosts, visibleUpdates).slice(0, 5);
  const topPosts = [...publishedPosts]
    .sort((left, right) => {
      if (right.viewCount !== left.viewCount) {
        return right.viewCount - left.viewCount;
      }

      if (right.likeCount !== left.likeCount) {
        return right.likeCount - left.likeCount;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })
    .slice(0, 3);
  const topCategories = [...postCategories]
    .sort((left, right) => right.contentCount - left.contentCount)
    .slice(0, 4);
  const topTags = Object.entries(
    visiblePosts.reduce<Record<string, { name: string; count: number }>>((accumulator, post) => {
      for (const tag of post.tags) {
        const current = accumulator[tag.id] ?? { name: tag.name, count: 0 };
        accumulator[tag.id] = {
          name: current.name,
          count: current.count + 1,
        };
      }

      return accumulator;
    }, {}),
  )
    .map(([id, value]) => ({ id, ...value }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"),
    )
    .slice(0, 6);
  const recent30Days = getRecent30DaySummary(visiblePosts, visibleUpdates);
  const latestPublishedAt = getLatestPublishedAt(visiblePosts, visibleUpdates);
  const siteRuntimeDays = getSiteRuntimeDays(siteCreatedAt);
  const totalWordCount = getContentWordCount(visiblePosts, visibleUpdates);
  const postWordCount = getContentWordCount(visiblePosts, []);
  const updateWordCount = getContentWordCount([], visibleUpdates);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/80 lg:grid-cols-[minmax(0,1.6fr)_16rem]">
        <div className="min-w-0">
          <p className="text-lg font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            {getGreeting()}，{displayName}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            这里是 {siteName} 的后台。先看现在已经有多少内容，再看状态、表现和最近节奏。
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <QuickTextLink href="/admin/posts/new" label="发布新文章" />
            <QuickTextLink href="/admin/updates/new" label="发布新动态" />
          </div>
        </div>

        <div className="grid gap-2 border-l border-zinc-200/80 pl-0 dark:border-zinc-800/80 lg:pl-5">
          <AsideMetric
            label="站点运行"
            value={siteRuntimeDays ? `${formatAdminNumber(siteRuntimeDays)} 天` : "—"}
            meta={siteCreatedAt ? `初始化于 ${formatAdminDateTime(siteCreatedAt)}` : "还没有初始化时间记录"}
          />
          <AsideMetric
            label="最近发布"
            value={latestPublishedAt ? formatAdminDateTime(latestPublishedAt) : "还没有发布记录"}
            meta="最近一次公开发布时间"
          />
        </div>
      </section>

      <section className="grid gap-x-8 gap-y-5 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/80 sm:grid-cols-2 xl:grid-cols-4">
        <KpiItem label="文章总数" value={`${formatAdminNumber(visiblePosts.length)} 篇`} />
        <KpiItem label="动态总数" value={`${formatAdminNumber(visibleUpdates.length)} 条`} />
        <KpiItem
          label="已发布内容"
          value={`${formatAdminNumber(publishedPosts.length + publishedUpdates.length)} 条`}
        />
        <KpiItem label="待审核评论" value={`${formatAdminNumber(commentStats.pending)} 条`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section>
          <SectionHeading eyebrow="Board" title="内容状态" />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <StatusPanel
              title="文章"
              published={`${formatAdminNumber(publishedPosts.length)} 已发布`}
              draft={`${formatAdminNumber(draftPosts)} 未发布`}
              revised={`${formatAdminNumber(revisedPublishedPosts)} 篇有修订`}
            />
            <StatusPanel
              title="动态"
              published={`${formatAdminNumber(publishedUpdates.length)} 已发布`}
              draft={`${formatAdminNumber(draftUpdates)} 未发布`}
              revised={`${formatAdminNumber(revisedPublishedUpdates)} 条有修订`}
            />
          </div>
        </section>

        <aside>
          <SectionHeading eyebrow="Queue" title="待处理" />
          <div className="mt-3 grid gap-0">
            <QueueRowCompact href="/admin/posts" title="未发布文章" value={`${formatAdminNumber(draftPosts)} 篇`} />
            <QueueRowCompact href="/admin/updates" title="未发布动态" value={`${formatAdminNumber(draftUpdates)} 条`} />
            <QueueRowCompact
              href="/admin/comments?status=pending"
              title="待审核评论"
              value={`${formatAdminNumber(commentStats.pending)} 条`}
            />
            <QueueRowCompact
              href="/admin/posts"
              title="有未发布修订"
              value={`${formatAdminNumber(revisedPublishedPosts + revisedPublishedUpdates)} 条`}
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section>
          <SectionHeading eyebrow="Board" title="表现与结构" />
          <div className="mt-3 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <div>
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">最受欢迎文章</p>
              <div className="mt-2.5 grid gap-0">
                {topPosts.length > 0 ? (
                  topPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/admin/posts/${encodeURIComponent(post.id)}`}
                      className="grid gap-1.5 border-b border-zinc-200/80 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-zinc-800/80"
                    >
                      <p className="text-sm font-medium text-zinc-950 transition hover:text-primary dark:text-zinc-50 dark:hover:text-primary">
                        {post.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{formatAdminNumber(post.viewCount)} 浏览</span>
                        <span>{formatAdminNumber(post.likeCount)} 点赞</span>
                        <span>{post.category?.name ?? "未分类"}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    还没有文章数据。
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">分类与标签</p>
              <div className="mt-2.5 grid gap-4">
                <div className="grid gap-2.5">
                  {topCategories.length > 0 ? (
                    topCategories.map((category) => (
                      <BarRow
                        key={category.id}
                        label={category.name}
                        value={`${formatAdminNumber(category.contentCount)} 篇`}
                        ratio={category.contentCount / Math.max(topCategories[0]?.contentCount ?? 1, 1)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">还没有分类数据。</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.length > 0 ? (
                    topTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 border border-zinc-200/80 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-300"
                      >
                        <span>#{tag.name}</span>
                        <span className="text-zinc-400 dark:text-zinc-500">{formatAdminNumber(tag.count)}</span>
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Trend" title="趋势与节奏" />
          <dl className="mt-3 grid gap-3 text-sm">
            <SummaryRow label="最近 30 天发布" value={`${formatAdminNumber(recent30Days.totalCount)} 条`} />
            <SummaryRow label="最近 30 天文章" value={`${formatAdminNumber(recent30Days.postCount)} 篇`} />
            <SummaryRow label="最近 30 天动态" value={`${formatAdminNumber(recent30Days.updateCount)} 条`} />
            <SummaryRow label="内容总字数" value={`${formatAdminNumber(totalWordCount)} 字`} />
            <SummaryRow label="文章字数" value={`${formatAdminNumber(postWordCount)} 字`} />
            <SummaryRow label="动态字数" value={`${formatAdminNumber(updateWordCount)} 字`} />
            <SummaryRow
              label="最近一次发布"
              value={latestPublishedAt ? formatAdminDateTime(latestPublishedAt) : "—"}
            />
          </dl>
        </section>
      </section>

      <section>
        <SectionHeading eyebrow="Flow" title="最近活动" />
        <div className="mt-3 grid gap-0">
          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={getAdminEditHref(item.kind, item.id)}
                className="grid gap-1.5 border-b border-zinc-200/80 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-zinc-800/80"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{item.kind === "Post" ? "文章" : "动态"}</span>
                  <span>·</span>
                  <StatusLabel status={item.status} />
                </div>
                <p className="text-sm font-medium text-zinc-950 transition hover:text-primary dark:text-zinc-50 dark:hover:text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatAdminDateTime(item.updatedAt)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              还没有内容记录。先开始写第一篇文章吧。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function AsideMetric({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{value}</p>
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{meta}</p>
    </div>
  );
}

function QuickTextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 border-b border-zinc-300/80 pb-0.5 text-sm text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-50"
    >
      {label}
    </Link>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
    </div>
  );
}

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{value}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function StatusPanel({
  title,
  published,
  draft,
  revised,
}: {
  title: string;
  published: string;
  draft: string;
  revised: string;
}) {
  return (
    <div className="grid gap-2 border-b border-zinc-200/80 pb-4 last:border-b-0 last:pb-0 dark:border-zinc-800/80 md:border-b-0 md:pb-0">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{title}</p>
      <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{published}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{draft}</span>
        <span>{revised}</span>
      </div>
    </div>
  );
}

function QueueRowCompact({
  href,
  title,
  value,
}: {
  href: string;
  title: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-b border-zinc-200/80 py-2.5 first:pt-0 last:border-b-0 last:pb-0 dark:border-zinc-800/80"
    >
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{title}</span>
      <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{value}</span>
    </Link>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800/80">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

function BarRow({
  label,
  value,
  ratio,
}: {
  label: string;
  value: string;
  ratio: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-zinc-700 dark:text-zinc-200">{label}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full bg-zinc-700 dark:bg-zinc-200"
          style={{ width: `${Math.max(10, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: ContentStatus }) {
  return (
    <span
      className={
        status === ContentStatus.PUBLISHED
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-amber-700 dark:text-amber-300"
      }
    >
      {status === ContentStatus.PUBLISHED ? "已发布" : "草稿"}
    </span>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "早上好";
  }

  if (hour < 14) {
    return "中午好";
  }

  if (hour < 18) {
    return "下午好";
  }

  return "晚上好";
}

function getAdminEditHref(kind: "Post" | "Update", id: number) {
  return kind === "Post"
    ? `/admin/posts/${encodeURIComponent(id)}`
    : `/admin/updates/${encodeURIComponent(id)}`;
}

function getLatestPublishedAt(
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
  updates: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
) {
  const timestamps = [...posts, ...updates]
    .map((item) => item.publishedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function getRecent30DaySummary(
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
  updates: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
) {
  const cutoff = Date.now() - 30 * 86_400_000;
  const postCount = posts.filter((item) => {
    if (!item.publishedAt) {
      return false;
    }

    return new Date(item.publishedAt).getTime() >= cutoff;
  }).length;
  const updateCount = updates.filter((item) => {
    if (!item.publishedAt) {
      return false;
    }

    return new Date(item.publishedAt).getTime() >= cutoff;
  }).length;

  return {
    postCount,
    updateCount,
    totalCount: postCount + updateCount,
  };
}
