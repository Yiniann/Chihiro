import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTimelinePath } from "@/lib/routes";
import { getTimelineItems, type TimelineItem, type TimelineSourceType } from "@/lib/timeline-items";
import { ArchiveTimeline, type ArchiveYearGroup } from "@/components/archive-timeline";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { SearchDialog } from "@/components/search-dialog";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { TimelinePageContentSkeleton } from "@/components/site-route-skeletons";
import { StaggerRevealItem } from "@/components/stagger-reveal";
import { TimelinePublishingOverview } from "@/components/timeline-publishing-overview";
import { siteConfig } from "@/lib/site";
import { formatInSiteTimeZone, getYearInSiteTimeZone } from "@/lib/site-time";
import {
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
  listPublicPosts,
  listPublicStandalonePages,
  listPublicUpdates,
} from "@/server/public-content";

export const metadata: Metadata = {
  title: "拾光",
};

type TimelinePageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

type ArchiveType = TimelineSourceType;

const archiveTypes: Array<{ value: ArchiveType; label: string }> = [
  { value: "all", label: "All" },
  { value: "posts", label: "Posts" },
  { value: "updates", label: "Updates" },
];
export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const { type } = await searchParams;
  const archiveType = normalizeArchiveType(type);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
        Timeline
      </p>
      <h1 className="mt-4 flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        <span>拾光</span>
        <span className="text-base font-medium tracking-normal text-zinc-400 dark:text-zinc-500">
          ·
        </span>
        <span className="text-base font-medium tracking-normal text-zinc-500 dark:text-zinc-400">
          时光机
        </span>
      </h1>

      <Suspense fallback={<TimelinePageContentSkeleton />}>
        <TimelinePageContent archiveType={archiveType} />
      </Suspense>
    </main>
  );
}

async function TimelinePageContent({ archiveType }: { archiveType: ArchiveType }) {
  let posts;
  let updates;
  let standalonePages;
  let siteSettings;

  try {
    [posts, updates, standalonePages, siteSettings] = await Promise.all([
      listPublicPosts(),
      listPublicUpdates(),
      listPublicStandalonePages(),
      getPublicSiteSettings(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  const items = getTimelineItems(archiveType, posts, updates);
  const siteTimeZone = siteSettings.timeZone ?? siteConfig.timeZone;
  const groups = groupTimelineItemsByYearAndMonth(items, siteTimeZone);
  const siteName = siteSettings.siteName ?? siteConfig.name;

  return (
    <>
      <StaggerRevealItem className="mt-6">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2 text-zinc-400 dark:text-zinc-500">
          <span className="text-7xl font-light leading-none tracking-[-0.06em] sm:text-8xl">
            {items.length}
          </span>
          <span className="pb-2 text-2xl font-medium tracking-tight sm:text-3xl">
            pieces, and the journey goes on
          </span>
        </div>
        <div className="mt-4 flex justify-end">
          <TimelinePublishingOverview
            posts={posts.map((item) => item.publishedAt)}
            updates={updates.map((item) => ({
              publishedAt: item.publishedAt,
              kind: item.kind,
            }))}
            standalonePages={standalonePages.map((item) => item.publishedAt)}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {archiveTypes.map((item) => {
              const active = archiveType === item.value;

              return (
                <Link
                  key={item.value}
                  href={getTimelinePath({ type: item.value })}
                  className={`px-1 py-1 text-sm font-medium transition ${
                    active
                      ? "text-primary"
                      : "text-zinc-500 hover:text-primary dark:text-zinc-400"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <SearchDialog
            buttonLabel="Search"
            placeholder="Search timeline"
            emptyState="No matching timeline entries found."
            idleState="Search by title, type, category, or content."
            items={items.map((item) => ({
              id: item.id,
              href: item.href ?? "/updates",
              title: item.title,
              publishedAt: item.publishedAt,
              overline: `${item.kindLabel} / ${item.categoryLabel}`,
              preview: item.summary,
              searchText: item.searchText,
            }))}
            timeZone={siteTimeZone}
          />
        </div>
      </StaggerRevealItem>

      <ArchiveTimeline groups={groups} timeZone={siteTimeZone} />

      <StaggerRevealItem className="mt-10 flex flex-col items-center gap-5" offset={22}>
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <SiteLogoMark
          siteName={siteName}
          caption="At the deepest point, time no longer moves forward. Here lies the very first, gently fallen stroke."
        />
        <ScrollToTopLink>Back to top</ScrollToTopLink>
      </StaggerRevealItem>
    </>
  );
}

function normalizeArchiveType(value?: string): ArchiveType {
  if (value === "posts" || value === "updates") {
    return value;
  }

  return "all";
}

function groupTimelineItemsByYearAndMonth(items: TimelineItem[], timeZone: string): ArchiveYearGroup[] {
  const yearGroups = new Map<string, Map<string, TimelineItem[]>>();

  for (const item of items) {
    const year = item.publishedAt ? getYearInSiteTimeZone(item.publishedAt, timeZone) : "Unknown";
    const month = item.publishedAt ? formatTimelineMonth(item.publishedAt, timeZone) : "未知";
    const currentYear = yearGroups.get(year) ?? new Map<string, TimelineItem[]>();
    const currentMonthItems = currentYear.get(month) ?? [];

    currentMonthItems.push(item);
    currentYear.set(month, currentMonthItems);
    yearGroups.set(year, currentYear);
  }

  return Array.from(yearGroups.entries()).map(([year, months]) => ({
    year,
    months: Array.from(months.entries()).map(([month, monthItems]) => ({
      month,
      items: monthItems,
    })),
  }));
}

function formatTimelineMonth(value: string | null, timeZone: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return formatInSiteTimeZone(date, "en", {
    month: "short",
  }, timeZone);
}
