import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookHeart,
  BookOpenText,
  FileText,
  FolderTree,
  Heart,
  Link2,
  MessageCircleMore,
  MessageCircleQuestion,
  NotebookPen,
  PenSquare,
  Send,
  Text,
} from "lucide-react";
import { getContentText } from "@/lib/content";
import { auth } from "@/server/public-auth";
import { getSitePresenceSummary } from "@/server/presence";
import { listPostCategories } from "@/server/repositories/categories";
import { getCommentStatsForAdmin } from "@/server/repositories/comments";
import { getFriendLinkApplicationStats } from "@/server/repositories/friend-link-applications";
import { listFriendLinksForAdmin } from "@/server/repositories/friend-links";
import { listStandalonePagesForAdmin } from "@/server/repositories/standalone-pages";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { getSiteLikeCount } from "@/server/repositories/site-likes";
import { listUpdatesForAdmin } from "@/server/repositories/updates";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";
import { RealtimeOverviewPanel } from "@/app/(admin)/admin/realtime-overview-panel";
import { CreateUpdateDialog } from "@/app/(admin)/admin/updates/new/new-update-entry";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import type { UpdateItem } from "@/server/repositories/updates";

type AdminOverviewPageProps = {
  searchParams?: Promise<{
    year?: string;
  }>;
};

export default async function AdminOverviewPage({
  searchParams,
}: AdminOverviewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [
    session,
    ownerProfile,
    presenceSummary,
    posts,
    updates,
    standalonePages,
    postCategories,
    commentStats,
    friendLinks,
    friendLinkApplicationStats,
    siteLikeCount,
  ] = await Promise.all([
    auth(),
    getOwnerDisplayProfile(),
    getSitePresenceSummary().catch(() => null),
    listPostsForAdmin(),
    listUpdatesForAdmin(),
    listStandalonePagesForAdmin(),
    listPostCategories(),
    getCommentStatsForAdmin(),
    listFriendLinksForAdmin(),
    getFriendLinkApplicationStats(),
    getSiteLikeCount(),
  ]);

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    getOwnerDisplayName(ownerProfile, "管理员");
  const totalWordCount = getTotalWordCount(posts, updates, standalonePages);
  const totalReadCount = posts.reduce((sum, post) => sum + post.viewCount, 0);
  const totalContentLikeCount = posts.reduce((sum, post) => sum + post.likeCount, 0);
  const availableTrendYears = getPublishingTrendYears(posts, updates, standalonePages);
  const parsedYear = Number.parseInt(resolvedSearchParams?.year ?? "", 10);
  const selectedTrendYear = availableTrendYears.includes(parsedYear)
    ? parsedYear
    : availableTrendYears[0];
  const publishingTrend = buildPublishingTrend(
    posts,
    updates,
    standalonePages,
    selectedTrendYear,
  );
  const publishingDistributionItems = [
    {
      label: "文章",
      value: countPublishedInYear(posts, selectedTrendYear),
      direction: "top" as const,
      unit: "篇",
    },
    {
      label: "动态",
      value: countPublishedInYear(updates, selectedTrendYear),
      direction: "left" as const,
      unit: "条",
    },
    {
      label: "独立页面",
      value: countPublishedInYear(standalonePages, selectedTrendYear),
      direction: "bottom" as const,
      unit: "页",
    },
    {
      label: "鉴赏",
      value: countPublishedReviewUpdatesInYear(updates, selectedTrendYear),
      direction: "right" as const,
      unit: "项",
    },
  ];

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 pb-2">
        <div className="min-w-0">
          <p className="text-lg font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            {getGreeting()}，{displayName}
          </p>
        </div>
      </section>

      <RealtimeOverviewPanel initialSummary={presenceSummary} />
      <ContentOperationsPanel
        items={[
          {
            label: "文章",
            count: posts.length,
            unit: "篇",
            icon: PenSquare,
            writeHref: "/admin/posts/new",
            manageHref: "/admin/posts",
            writeLabel: "撰写",
            manageLabel: "管理",
          },
          {
            label: "动态",
            count: updates.length,
            unit: "条",
            icon: NotebookPen,
            writeHref: "/admin/updates/new",
            manageHref: "/admin/updates",
            writeLabel: "撰写",
            manageLabel: "管理",
          },
          {
            label: "独立页面",
            count: standalonePages.length,
            unit: "页",
            icon: FileText,
            writeHref: "/admin/pages/new",
            manageHref: "/admin/pages",
            writeLabel: "撰写",
            manageLabel: "管理",
          },
        ]}
      />
      <DenseStatsPanel
        items={[
          {
            label: "页面",
            value: formatAdminNumber(standalonePages.length),
            icon: FileText,
          },
          {
            label: "全部评论",
            value: formatAdminNumber(commentStats.total),
            icon: MessageCircleMore,
          },
          {
            label: "未读评论",
            value: formatAdminNumber(commentStats.pending),
            icon: MessageCircleQuestion,
          },
          {
            label: "友链",
            value: formatAdminNumber(friendLinks.length),
            icon: Link2,
          },
          {
            label: "友链申请",
            value: formatAdminNumber(friendLinkApplicationStats.pending),
            icon: Send,
          },
          {
            label: "分类",
            value: formatAdminNumber(postCategories.length),
            icon: FolderTree,
          },
          {
            label: "全站字数",
            value: formatAdminNumber(totalWordCount),
            icon: Text,
          },
          {
            label: "全站总阅读量",
            value: formatAdminNumber(totalReadCount),
            icon: BookOpenText,
          },
          {
            label: "全站内容点赞数",
            value: formatAdminNumber(totalContentLikeCount),
            icon: BookHeart,
          },
          {
            label: "站点点赞数",
            value: formatAdminNumber(siteLikeCount),
            icon: Heart,
          },
        ]}
      />
      <PublishingTrendPanel
        weeks={publishingTrend.weeks}
        monthLabels={publishingTrend.monthLabels}
        totalDays={publishingTrend.totalDays}
        selectedYear={selectedTrendYear}
        availableYears={availableTrendYears}
        distributionItems={publishingDistributionItems}
      />
    </div>
  );
}

function getTotalWordCount(
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
  updates: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
  standalonePages: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
) {
  return [...posts, ...updates, ...standalonePages].reduce((total, item) => {
    const text = getContentText(item.contentHtml, item.content);
    return total + countTextUnits(text);
  }, 0);
}

function countTextUnits(value: string) {
  const hanCharacters = value.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const nonHanText = value.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ");
  const latinWords = nonHanText.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;

  return hanCharacters + latinWords;
}

function countPublishedInYear<
  T extends {
    publishedAt: string | Date | null;
  },
>(items: T[], year: number) {
  return items.filter((item) => {
    if (!item.publishedAt) {
      return false;
    }

    const date = new Date(item.publishedAt);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === year;
  }).length;
}

function countPublishedReviewUpdatesInYear(items: UpdateItem[], year: number) {
  return items.filter((item) => {
    if (!item.publishedAt) {
      return false;
    }

    const date = new Date(item.publishedAt);

    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
      return false;
    }

    return item.kind === "MOVIE" || item.kind === "MUSIC" || item.kind === "OBJECT";
  }).length;
}

function ContentOperationsPanel({
  items,
}: {
  items: Array<{
    label: string;
    count: number;
    unit: string;
    icon: LucideIcon;
    writeHref: string;
    manageHref: string;
    writeLabel: string;
    manageLabel: string;
  }>;
}) {
  return (
    <section className="grid gap-4">
      <div className="border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          内容操作
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <article
            key={item.label}
            className="border-r border-zinc-200/80 pr-3 last:border-r-0 last:pr-0 dark:border-zinc-800/80"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex size-6 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500 sm:size-8">
                <item.icon className="size-4 sm:size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                  {formatAdminNumber(item.count)}
                  <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">{item.unit}</span>
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 pl-9 sm:pl-11">
              {item.writeHref === "/admin/updates/new" ? (
                <CreateUpdateDialog
                  triggerLabel={item.writeLabel}
                  triggerClassName="inline-flex items-center border-b border-zinc-300/80 pb-0.5 text-[11px] text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-50 sm:text-sm"
                />
              ) : (
                <ActionLink href={item.writeHref} label={item.writeLabel} />
              )}
              <ActionLink href={item.manageHref} label={item.manageLabel} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center border-b border-zinc-300/80 pb-0.5 text-[11px] text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-50 sm:text-sm"
    >
      {label}
    </Link>
  );
}

function DenseStatsPanel({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
  }>;
}) {
  return (
    <section className="grid gap-4">
      <div className="pb-1">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          数据统计
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <article key={item.label} className="flex items-start gap-3">
            <span className="inline-flex size-7 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500">
              <item.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {item.value}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublishingTrendPanel({
  weeks,
  monthLabels,
  totalDays,
  selectedYear,
  availableYears,
  distributionItems,
}: {
  weeks: PublishingTrendWeek[];
  monthLabels: PublishingTrendMonthLabel[];
  totalDays: number;
  selectedYear: number;
  availableYears: number[];
  distributionItems: Array<{
    label: string;
    value: number;
    direction: "top" | "right" | "bottom" | "left";
    unit: string;
    empty?: boolean;
  }>;
}) {
  const totalPublished = weeks.reduce(
    (sum, week) =>
      sum +
      week.days.reduce(
        (daySum, day) => daySum + (day.isInRange ? day.count : 0),
        0,
      ),
    0,
  );

  return (
    <section className="grid gap-3">
      <div className="border-b border-zinc-200/80 pb-2 dark:border-zinc-800/80">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          发布概览
        </h2>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <nav
          aria-label="发布年份"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80 md:grid md:shrink-0 md:gap-2 md:border-b-0 md:border-r md:pb-0 md:pr-6"
        >
          {availableYears.map((year) => {
            const isActive = year === selectedYear;

            return (
              <Link
                key={year}
                href={buildOverviewYearHref(year)}
                scroll={false}
                className={`inline-flex h-7 items-center text-sm font-semibold tracking-tight transition sm:h-8 sm:text-base ${
                  isActive
                    ? "text-primary"
                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
              >
                {year}
              </Link>
            );
          })}
        </nav>

        <div className="grid min-w-0 flex-1 gap-5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedYear} 年 {totalDays} 天内共发布 {formatAdminNumber(totalPublished)} 条
          </p>

          <div className="grid gap-3">
            <div className="max-w-full overflow-x-auto md:overflow-x-visible">
              <div className="inline-block min-w-max">
                <div
                  className="grid gap-x-1 gap-y-1"
                  style={{ gridTemplateColumns: `1.25rem repeat(${weeks.length}, 10px)` }}
                >
                  <div />
                  {weeks.map((week, index) => {
                    const monthLabel = monthLabels.find((label) => label.column === index);

                    return (
                      <div
                        key={`${week.key}-month`}
                        className="relative h-3"
                      >
                        {monthLabel ? (
                          <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-3 text-zinc-500 dark:text-zinc-400">
                            {monthLabel.label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="grid grid-rows-7 gap-0.5 pt-px text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span />
                    <span className="leading-3">一</span>
                    <span />
                    <span className="leading-3">三</span>
                    <span />
                    <span className="leading-3">五</span>
                    <span />
                  </div>

                  {weeks.map((week) => (
                    <div key={week.key} className="grid grid-rows-7 gap-0.5">
                      {week.days.map((day) => (
                        <div key={day.key} className="group relative">
                          <div
                            aria-label={day.label}
                            className={getTrendCellClassName(day.level, day.isInRange)}
                          />
                          {day.isInRange ? (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                              <div className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-[11px] text-white shadow-lg shadow-zinc-950/15 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-black/20">
                                {day.label}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pr-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>Less</span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={getTrendCellClassName(level as 0 | 1 | 2 | 3 | 4, true)}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="pt-2">
            <ContentCrossOverviewPanel
              items={distributionItems}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentCrossOverviewPanel({
  items,
  selectedYear,
}: {
  items: Array<{
    label: string;
    value: number;
    direction: "top" | "right" | "bottom" | "left";
    unit: string;
    empty?: boolean;
  }>;
  selectedYear: number;
}) {
  const totalValue = items.reduce(
    (sum, item) => sum + (item.empty ? 0 : item.value),
    0,
  );
  const topItem = items.find((item) => item.direction === "top");
  const rightItem = items.find((item) => item.direction === "right");
  const bottomItem = items.find((item) => item.direction === "bottom");
  const leftItem = items.find((item) => item.direction === "left");
  const maxValue = Math.max(
    ...items.map((item) => (item.empty ? 0 : item.value)),
    0,
  );
  const topArm = getCrossArmLength(topItem, maxValue);
  const rightArm = getCrossArmLength(rightItem, maxValue);
  const bottomArm = getCrossArmLength(bottomItem, maxValue);
  const leftArm = getCrossArmLength(leftItem, maxValue);
  const nodeDiameterX = (0.625 / 14) * 100;
  const nodeDiameterY = (0.625 / 12) * 100;
  const polygonPoints = [
    `50 ${50 - (topArm > 0 ? topArm + nodeDiameterY : 0)}`,
    `${50 + (rightArm > 0 ? rightArm + nodeDiameterX : 0)} 50`,
    `50 ${50 + (bottomArm > 0 ? bottomArm + nodeDiameterY : 0)}`,
    `${50 - (leftArm > 0 ? leftArm + nodeDiameterX : 0)} 50`,
  ].join(" ");

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      <div className="grid gap-3 md:min-w-[15rem]">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            发布结构
          </p>
          <p className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {selectedYear} 年发布概况
          </p>
        </div>

        <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          {items.map((item) => {
            const copy =
              item.label === "鉴赏"
                ? `鉴赏型动态 ${formatAdminNumber(item.value)} ${item.unit}`
                : `${item.label} ${formatAdminNumber(item.value)} ${item.unit}`;

            return <p key={item.label}>{copy}</p>;
          })}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            鉴赏统计包含影视、音乐与物品类动态。
          </p>
        </div>
      </div>

      <div className="flex justify-center py-2 md:flex-1 md:justify-start">
        <div className="relative h-[20rem] w-full max-w-[24rem]">
          <div className="absolute inset-x-0 top-0 flex justify-center text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {topItem?.label}
              </p>
              {shouldShowCrossValue(topItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(topItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center text-right">
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {leftItem?.label}
              </p>
              {shouldShowCrossValue(leftItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(leftItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center text-left">
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {rightItem?.label}
              </p>
              {shouldShowCrossValue(rightItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(rightItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-center text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {bottomItem?.label}
              </p>
              {shouldShowCrossValue(bottomItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(bottomItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-20 inset-y-16">
            <div className="relative h-full w-full">
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                <polygon
                  points={polygonPoints}
                  className="fill-primary/20 dark:fill-primary/25"
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-primary/35 dark:bg-primary/45" />
              <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-primary/35 dark:bg-primary/45" />

              <div className="absolute left-1/2 top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white dark:bg-zinc-950" />

              {items.map((item) => {
                const percent = getCrossPercent(item, maxValue);
                const armLength = (percent / 100) * 6.5;
                const coloredArmLength = armLength;
                const armClassName = item.empty
                  ? "bg-zinc-300/80 dark:bg-zinc-700/80"
                  : "bg-primary";
                const nodeClassName = item.empty
                  ? "border-zinc-300 dark:border-zinc-700"
                  : "border-primary";

                if (item.direction === "top") {
                  return (
                    <div key={item.label}>
                    <div
                      className={`absolute left-1/2 top-1/2 z-[1] w-px -translate-x-1/2 rounded-full ${armClassName}`}
                      style={{ height: `${coloredArmLength}rem`, marginTop: `-${coloredArmLength}rem` }}
                    />
                      <div
                        className={`absolute left-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ top: `calc(50% - ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                if (item.direction === "right") {
                  return (
                    <div key={item.label}>
                    <div
                      className={`absolute left-1/2 top-1/2 z-[1] h-px -translate-y-1/2 rounded-full ${armClassName}`}
                      style={{ width: `${coloredArmLength}rem` }}
                    />
                      <div
                        className={`absolute top-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ left: `calc(50% + ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                if (item.direction === "bottom") {
                  return (
                    <div key={item.label}>
                    <div
                      className={`absolute left-1/2 top-1/2 z-[1] w-px -translate-x-1/2 rounded-full ${armClassName}`}
                      style={{ height: `${coloredArmLength}rem` }}
                    />
                      <div
                        className={`absolute left-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ top: `calc(50% + ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                return (
                  <div key={item.label}>
                    <div
                      className={`absolute right-1/2 top-1/2 z-[1] h-px -translate-y-1/2 rounded-full ${armClassName}`}
                      style={{ width: `${coloredArmLength}rem` }}
                    />
                    <div
                      className={`absolute top-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                      style={{ left: `calc(50% - ${armLength}rem)` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCrossValue(
  item:
    | {
        label: string;
        value: number;
        direction: "top" | "right" | "bottom" | "left";
        empty?: boolean;
      }
    | undefined,
  maxValue: number,
) {
  if (!item || item.empty || maxValue <= 0) {
    return "";
  }

  return `${getCrossPercent(item, maxValue)}%`;
}

function shouldShowCrossValue(
  item:
    | {
        label: string;
        value: number;
        direction: "top" | "right" | "bottom" | "left";
        empty?: boolean;
      }
    | undefined,
  maxValue: number,
) {
  return Boolean(item && !item.empty && maxValue > 0);
}

function getCrossArmLength(
  item:
    | {
        label: string;
        value: number;
        direction: "top" | "right" | "bottom" | "left";
        empty?: boolean;
      }
    | undefined,
  maxValue: number,
) {
  const percent = getCrossPercent(item, maxValue);

  if (percent <= 0) {
    return 0;
  }

  return (percent / 100) * 50;
}

function getCrossPercent(
  item:
    | {
        label: string;
        value: number;
        direction: "top" | "right" | "bottom" | "left";
        empty?: boolean;
      }
    | undefined,
  maxValue: number,
) {
  if (!item || item.empty || maxValue <= 0) {
    return 0;
  }

  return Math.round((item.value / maxValue) * 100);
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

type PublishingTrendDay = {
  key: string;
  count: number;
  label: string;
  level: 0 | 1 | 2 | 3 | 4;
  isInRange: boolean;
  date: Date;
};

type PublishingTrendWeek = {
  key: string;
  days: PublishingTrendDay[];
};

type PublishingTrendMonthLabel = {
  key: string;
  label: string;
  column: number;
};

function buildPublishingTrend(
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
  updates: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
  standalonePages: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
  selectedYear: number,
) {
  const rangeStart = startOfDay(new Date(selectedYear, 0, 1));
  const rangeEnd = startOfDay(new Date(selectedYear, 11, 31));
  const totalDays = getInclusiveDayCount(rangeStart, rangeEnd);
  const gridStart = startOfWeek(rangeStart);
  const gridEnd = endOfWeek(rangeEnd);

  const countsByDay = new Map<string, number>();
  const publishedDates = [
    ...posts.map((item) => item.publishedAt),
    ...updates.map((item) => item.publishedAt),
    ...standalonePages.map((item) => item.publishedAt),
  ];

  for (const value of publishedDates) {
    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) {
      continue;
    }

    const dayKey = formatDayKey(date);
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  const weeks: PublishingTrendWeek[] = [];
  const monthLabels: PublishingTrendMonthLabel[] = [];
  const cursor = new Date(gridStart);
  let weekIndex = 0;
  let previousMonth = "";

  while (cursor <= gridEnd) {
    const days: PublishingTrendDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + dayIndex);

      const key = formatDayKey(date);
      const count = countsByDay.get(key) ?? 0;
      const isInRange = date >= rangeStart && date <= rangeEnd;

      days.push({
        key,
        count,
        label: `${formatPreciseTrendDate(date)} 发布 ${formatAdminNumber(count)} 条`,
        level: isInRange ? getTrendLevel(count) : 0,
        isInRange,
        date,
      });
    }

    const monthSource = days.find((day) => day.isInRange);
    if (monthSource) {
      const monthKey = `${monthSource.date.getFullYear()}-${monthSource.date.getMonth() + 1}`;

      if (monthKey !== previousMonth) {
        monthLabels.push({
          key: monthKey,
          label: formatTrendMonth(monthSource.date),
          column: weekIndex,
        });
        previousMonth = monthKey;
      }
    }

    weeks.push({
      key: days[0]?.key ?? `week-${weekIndex}`,
      days,
    });

    cursor.setDate(cursor.getDate() + 7);
    weekIndex += 1;
  }

  return { weeks, monthLabels, totalDays };
}

function getPublishingTrendYears(
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
  updates: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
  standalonePages: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
) {
  const years = new Set<number>([new Date().getFullYear()]);

  for (const value of [
    ...posts.map((item) => item.publishedAt),
    ...updates.map((item) => item.publishedAt),
    ...standalonePages.map((item) => item.publishedAt),
  ]) {
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      years.add(date.getFullYear());
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

function buildOverviewYearHref(year: number) {
  const searchParams = new URLSearchParams();
  searchParams.set("year", String(year));
  return `/admin?${searchParams.toString()}`;
}

function getTrendLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count <= 3) {
    return 2;
  }

  if (count <= 5) {
    return 3;
  }

  return 4;
}

function getTrendCellClassName(
  level: 0 | 1 | 2 | 3 | 4,
  isInRange: boolean,
) {
  const baseClassName = "block size-[10px] rounded-[2px]";

  if (!isInRange) {
    return `${baseClassName} bg-transparent`;
  }

  switch (level) {
    case 0:
      return `${baseClassName} bg-zinc-200/80 dark:bg-zinc-800/80`;
    case 1:
      return `${baseClassName} bg-primary/42 dark:bg-primary/45`;
    case 2:
      return `${baseClassName} bg-primary/62 dark:bg-primary/64`;
    case 3:
      return `${baseClassName} bg-primary/82 dark:bg-primary/84`;
    case 4:
      return `${baseClassName} bg-primary dark:bg-primary`;
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  nextDate.setDate(nextDate.getDate() - nextDate.getDay());
  return nextDate;
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  return nextDate;
}

function getInclusiveDayCount(startDate: Date, endDate: Date) {
  const startTime = startOfDay(startDate).getTime();
  const endTime = startOfDay(endDate).getTime();
  return Math.floor((endTime - startTime) / 86_400_000) + 1;
}

function formatDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTrendDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatPreciseTrendDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatTrendMonth(date: Date) {
  return formatTrendDate(date).replace("月", "月");
}
