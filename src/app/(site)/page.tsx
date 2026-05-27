import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { HomeTimelineRail } from "@/components/home-timeline-rail";
import { ProfileAvatar } from "@/components/profile-avatar";
import { HeroIntro } from "@/components/hero-intro";
import { RelativeDate } from "@/components/relative-date";
import { ScrollToSectionLink } from "@/components/scroll-to-section-link";
import { SocialIconLinks } from "@/components/social-icon-links";
import { StaggerReveal, StaggerRevealItem } from "@/components/stagger-reveal";
import { ChevronDown } from "lucide-react";
import {
  getContentText,
  getRenderedContentHtml,
  normalizeHtmlForHydration,
  stripMediaFromHtml,
} from "@/lib/content";
import { getPostPath } from "@/lib/routes";
import { siteConfig } from "@/lib/site";
import type { SocialLink } from "@/lib/social-links";
import { getTimelineItems } from "@/lib/timeline-items";
import {
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
  listPublicPosts,
  listPublicUpdates,
} from "@/server/public-content";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";
import Link from "next/link";

export default async function HomePage() {
  let siteSettings;
  let posts;
  let updates;
  let ownerProfile;

  try {
    [siteSettings, posts, updates, ownerProfile] = await Promise.all([
      getPublicSiteSettings(),
      listPublicPosts(),
      listPublicUpdates(),
      getOwnerDisplayProfile(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  const authorName = getOwnerDisplayName(ownerProfile, siteConfig.author);
  const avatarUrl = ownerProfile?.image ?? siteConfig.avatar;
  const heroIntro = siteSettings.heroIntro ?? siteConfig.heroIntro;
  const summary = siteSettings.summary ?? siteConfig.summary;
  const heroSocialLinks = buildHeroSocialLinks(
    ownerProfile?.socialLinks ?? [],
    ownerProfile?.email ?? null,
    ownerProfile?.githubUrl ?? null,
  );
  const timelineItems = getTimelineItems("all", posts, updates);
  const homeTimelineRange = getHomeTimelineRange();
  const homeTimelineItems = timelineItems.filter((item) =>
    isTimelineItemWithinRange(item.publishedAt, homeTimelineRange.start, homeTimelineRange.end),
  );
  const recentPosts = posts.slice(0, 5);
  const latestUpdate = updates[0] ?? null;
  const latestUpdateHtml = latestUpdate
    ? getRenderedContentHtml(latestUpdate.contentHtml, latestUpdate.content) ?? ""
    : "";
  const latestUpdateText = latestUpdate
    ? getContentText(latestUpdate.contentHtml, latestUpdate.content)
    : "";
  const latestUpdateDisplayHtml = latestUpdateHtml
    ? normalizeHtmlForHydration(stripMediaFromHtml(latestUpdateHtml))
    : null;
  const shouldClampLatestUpdate = latestUpdateText.length > 520;

  return (
    <main className="relative w-full px-6 sm:px-12 lg:px-24">
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 hidden h-16 w-[min(42rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-full bg-[rgba(2,6,23,0.26)] opacity-90 blur-xl dark:block sm:top-4 sm:w-[min(44rem,calc(100vw-3rem))]" />
      <StaggerReveal delayChildren={0.05} staggerChildren={0.09}>
        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-5xl items-center gap-10 py-[clamp(1.5rem,6vh,4rem)] sm:min-h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(18rem,24rem)_minmax(24rem,34rem)] lg:justify-center lg:gap-10 xl:grid-cols-[minmax(20rem,26rem)_minmax(26rem,36rem)] xl:gap-12">
          <StaggerRevealItem className="flex justify-center" offset={24}>
            <div className="relative h-[20rem] w-[20rem] overflow-hidden rounded-full sm:h-[24rem] sm:w-[24rem] lg:h-[24rem] lg:w-[24rem] xl:h-[26rem] xl:w-[26rem]">
              <ProfileAvatar author={authorName} src={avatarUrl} />
            </div>
          </StaggerRevealItem>

          <StaggerRevealItem className="hero-copy max-w-3xl" offset={20}>
            <h1 className="hero-copy-title text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
              {authorName}
            </h1>
            <HeroIntro intro={heroIntro} authorName={authorName} />
            <p className="hero-copy-summary reading-copy mt-5 max-w-2xl text-base leading-8 text-zinc-500 dark:text-zinc-400">
              {summary}
            </p>
            {heroSocialLinks.length > 0 ? (
              <SocialIconLinks links={heroSocialLinks} className="mt-7" />
            ) : null}
          </StaggerRevealItem>

          <StaggerRevealItem
            offset={14}
            className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex"
          >
            <ScrollToSectionLink
              targetId="home-feed"
              ariaLabel="Scroll to home feed"
              className="pointer-events-auto inline-flex items-center justify-center p-2 text-primary transition hover:opacity-80"
            >
              <ChevronDown className="h-6 w-6" strokeWidth={2.2} />
            </ScrollToSectionLink>
          </StaggerRevealItem>
        </section>

        <section
          id="home-feed"
          className="home-feed mx-auto grid w-full max-w-5xl gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-16"
        >
          <StaggerRevealItem offset={20}>
            <HomeFeedSection
              eyebrow="Latest writing"
              title="最近写作"
            >
              {recentPosts.length > 0 ? (
                <StaggerReveal className="grid gap-1" staggerChildren={0.06}>
                  {recentPosts.map((post) => (
                    <StaggerRevealItem key={post.id} offset={12}>
                      <article className="group relative -mx-3 rounded-lg border-b border-zinc-200/80 px-3 py-4 last:border-b-0 dark:border-zinc-800/80">
                        <Link
                          href={getPostPath({ slug: post.slug, categorySlug: post.category?.slug })}
                          aria-label={`Open ${post.title}`}
                          className="absolute inset-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <div className="pointer-events-none relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                          <p className="home-feed-item-title min-w-0 flex-1 truncate whitespace-nowrap text-zinc-900 transition group-hover:text-primary dark:text-zinc-100">
                            {post.title}
                          </p>
                          <p className="home-feed-date text-zinc-500 dark:text-zinc-400">
                            <RelativeDate value={post.publishedAt} />
                          </p>
                        </div>
                      </article>
                    </StaggerRevealItem>
                  ))}
                </StaggerReveal>
              ) : (
                <EmptyHomeFeed copy="还没有公开文章。" />
              )}
            </HomeFeedSection>
          </StaggerRevealItem>

          <StaggerRevealItem offset={20}>
            <HomeFeedSection
              eyebrow="Field notes"
              title="最近动态"
            >
              {latestUpdate ? (
                <article className="border-b border-zinc-200/80 py-4 dark:border-zinc-800/80">
                  {latestUpdateDisplayHtml ? (
                    <div className="grid gap-3">
                      <div
                        className={
                          shouldClampLatestUpdate
                            ? "relative max-h-[22rem] overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-16 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-zinc-950"
                            : undefined
                        }
                      >
                        <div
                          className="home-feed-update-content text-zinc-900 dark:text-zinc-100"
                          dangerouslySetInnerHTML={{ __html: latestUpdateDisplayHtml }}
                        />
                      </div>
                      {shouldClampLatestUpdate ? (
                        <Link
                          href="/updates"
                          className="w-fit text-sm font-medium text-zinc-500 transition hover:text-primary dark:text-zinc-400"
                        >
                          查看更多动态
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <p className="home-feed-item-title text-zinc-900 dark:text-zinc-100">
                      {latestUpdate.title}
                    </p>
                  )}
                  <p className="home-feed-date mt-3 text-zinc-500 dark:text-zinc-400">
                    <RelativeDate value={latestUpdate.publishedAt} />
                  </p>
                </article>
              ) : (
                <EmptyHomeFeed copy="还没有公开动态。" />
              )}
            </HomeFeedSection>
          </StaggerRevealItem>
        </section>

        {homeTimelineItems.length > 0 ? (
          <StaggerRevealItem offset={22}>
            <HomeTimelineRail
              items={homeTimelineItems}
              label="沿途拾光"
              eyebrow="Glimpses Along the Way"
              rangeStart={homeTimelineRange.start}
              rangeEnd={homeTimelineRange.end}
            />
          </StaggerRevealItem>
        ) : null}
      </StaggerReveal>
    </main>
  );
}

function HomeFeedSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <p className="home-feed-eyebrow font-normal uppercase text-zinc-500 dark:text-zinc-400">
          {eyebrow}
        </p>
        <p className="home-feed-title mt-1 font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}

function EmptyHomeFeed({ copy }: { copy: string }) {
  return (
    <p className="border-b border-dashed border-zinc-200/80 py-5 text-sm text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
      {copy}
    </p>
  );
}

function buildHeroSocialLinks(
  socialLinks: SocialLink[],
  email: string | null,
  githubUrl: string | null,
): SocialLink[] {
  const links = [...socialLinks];

  if (email && !links.some((link) => link.platform === "email")) {
    links.unshift({
      platform: "email",
      label: "Email",
      href: `mailto:${email}`,
    });
  }

  if (githubUrl && !links.some((link) => link.platform === "github")) {
    const emailIndex = links.findIndex((link) => link.platform === "email");
    const insertIndex = emailIndex >= 0 ? emailIndex + 1 : 0;

    links.splice(insertIndex, 0, {
      platform: "github",
      label: "GitHub",
      href: githubUrl,
    });
  }

  return links;
}

function getHomeTimelineRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function isTimelineItemWithinRange(value: string | null, start: string, end: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (Number.isNaN(date.getTime()) || Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return false;
  }

  const time = date.getTime();
  return time >= startTime && time < endTime;
}
