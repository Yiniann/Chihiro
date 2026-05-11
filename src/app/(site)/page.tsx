import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { ProfileAvatar } from "@/components/profile-avatar";
import { HeroIntro } from "@/components/hero-intro";
import { RelativeDate } from "@/components/relative-date";
import { getRenderedContentHtml, normalizeHtmlForHydration } from "@/lib/content";
import { getPostPath } from "@/lib/routes";
import { siteConfig } from "@/lib/site";
import {
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
  listPublicPosts,
  listPublicUpdates,
} from "@/server/public-content";
import Link from "next/link";

export default async function HomePage() {
  let siteSettings;
  let posts;
  let updates;

  try {
    [siteSettings, posts, updates] = await Promise.all([
      getPublicSiteSettings(),
      listPublicPosts(),
      listPublicUpdates(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  const authorName = siteSettings.authorName ?? siteConfig.author;
  const avatarUrl = siteSettings.authorAvatarUrl ?? siteConfig.avatar;
  const heroIntro = siteSettings.heroIntro ?? siteConfig.heroIntro;
  const summary = siteSettings.summary ?? siteConfig.summary;
  const recentPosts = posts.slice(0, 5);
  const latestUpdate = updates[0] ?? null;
  const latestUpdateHtml = latestUpdate
    ? normalizeHtmlForHydration(
        getRenderedContentHtml(latestUpdate.contentHtml, latestUpdate.content) ?? "",
      )
    : null;

  return (
    <main className="relative w-full px-6 sm:px-12 lg:px-24">
      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-5xl items-center gap-10 py-[clamp(1.5rem,6vh,4rem)] sm:min-h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(18rem,24rem)_minmax(24rem,34rem)] lg:justify-center lg:gap-10 xl:grid-cols-[minmax(20rem,26rem)_minmax(26rem,36rem)] xl:gap-12">
        <div className="flex justify-center">
          <div className="relative h-[20rem] w-[20rem] overflow-hidden rounded-full sm:h-[24rem] sm:w-[24rem] lg:h-[24rem] lg:w-[24rem] xl:h-[26rem] xl:w-[26rem]">
            <ProfileAvatar author={authorName} src={avatarUrl} />
          </div>
        </div>

        <div className="hero-copy max-w-3xl">
          <h1 className="hero-copy-title text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
            {authorName}
          </h1>
          <HeroIntro intro={heroIntro} authorName={authorName} />
          <p className="hero-copy-summary reading-copy mt-5 max-w-2xl text-base leading-8 text-zinc-500 dark:text-zinc-400">
            {summary}
          </p>
        </div>
      </section>

      <section className="home-feed mx-auto grid w-full max-w-5xl gap-12 border-t border-zinc-200/80 py-14 dark:border-zinc-800/80 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-16">
        <HomeFeedSection
          eyebrow="Latest writing"
          title="最近写作"
        >
          {recentPosts.length > 0 ? (
            <div className="grid gap-1">
              {recentPosts.map((post) => (
                <article
                  key={post.id}
                  className="group relative -mx-3 rounded-lg border-b border-zinc-200/80 px-3 py-4 last:border-b-0 dark:border-zinc-800/80"
                >
                  <Link
                    href={getPostPath({ slug: post.slug, categorySlug: post.category?.slug })}
                    aria-label={`Open ${post.title}`}
                    className="absolute inset-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                  <div className="pointer-events-none relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <p className="home-feed-item-title text-zinc-900 transition group-hover:text-primary dark:text-zinc-100">
                      {post.title}
                    </p>
                    <p className="home-feed-date text-zinc-500 dark:text-zinc-400">
                      <RelativeDate value={post.publishedAt} />
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyHomeFeed copy="还没有公开文章。" />
          )}
        </HomeFeedSection>

        <HomeFeedSection
          eyebrow="Field notes"
          title="最近动态"
        >
          {latestUpdate ? (
            <article className="border-b border-zinc-200/80 py-4 dark:border-zinc-800/80">
              {latestUpdateHtml ? (
                <div
                  className="home-feed-update-content text-zinc-900 dark:text-zinc-100"
                  dangerouslySetInnerHTML={{ __html: latestUpdateHtml }}
                />
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
      </section>
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
        <p className="home-feed-eyebrow uppercase text-zinc-900 dark:text-zinc-100">
          {eyebrow}
        </p>
        <p className="home-feed-title mt-1 text-zinc-900 dark:text-zinc-100">
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
