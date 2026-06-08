import type { Metadata } from "next";
import {
  ArrowUpRight,
  Layers3,
  Sparkles,
} from "lucide-react";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { getMoreSectionBySlug } from "@/lib/more-sections";
import { StaggerReveal, StaggerRevealItem } from "@/components/stagger-reveal";
import {
  getBookmarkFallbackLogoUrl,
  getBookmarkKindLabel,
} from "@/lib/bookmarks";
import {
  isPublicSiteUnavailableError,
  listPublicBookmarkCategories,
  listPublicBookmarks,
  type PublicBookmarkCategory,
  type PublicBookmarkItem,
} from "@/server/public-content";
import { BookmarkLogo } from "@/app/(site)/bookmarks/bookmark-logo";

export const metadata: Metadata = {
  title: "书签",
  description: "平时收藏的文章、工具与资源链接。",
};

export default async function BookmarksPage() {
  const section = getMoreSectionBySlug("bookmarks");

  if (!section) {
    throw new Error("Missing more section config for bookmarks.");
  }

  let bookmarks: PublicBookmarkItem[];
  let categories: PublicBookmarkCategory[];

  try {
    [bookmarks, categories] = await Promise.all([
      listPublicBookmarks(),
      listPublicBookmarkCategories(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  const featuredBookmarks = bookmarks.filter((item) => item.isFeatured);
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-10">
      <StaggerReveal className="grid gap-14" delayChildren={0.04} staggerChildren={0.08}>
        <StaggerRevealItem>
          <section className="pb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                {section.eyebrow}
              </p>
              <h1 className="mt-4 flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                <span>{section.title}</span>
                <span className="text-base font-medium tracking-normal text-zinc-400 dark:text-zinc-500">
                  ·
                </span>
                <span className="text-base font-medium tracking-normal text-zinc-500 dark:text-zinc-400">
                  收藏夹
                </span>
              </h1>
            </div>
          </section>
        </StaggerRevealItem>

        {featuredBookmarks.length > 0 ? (
          <StaggerRevealItem>
            <section className="grid gap-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid gap-2">
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                    Featured
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {featuredBookmarks.slice(0, 3).map((item) => (
                  <FeaturedBookmarkCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </StaggerRevealItem>
        ) : null}

        <StaggerRevealItem>
          <section className="grid gap-8">
            {bookmarks.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-200/80 bg-zinc-50/70 px-6 py-10 text-sm text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-400">
                还没有公开书签，先去后台添加几条吧。
              </div>
            ) : null}

            {categories.map((category) => {
              const items = bookmarks.filter((item) => item.category.id === category.id);

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={category.id} id={category.slug} className="grid gap-4 scroll-mt-28">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
                    <div className="grid gap-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                        {category.eyebrow ?? category.name}
                      </p>
                      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {category.name}
                      </h2>
                      <p className="max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                        {category.description}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      <Layers3 className="h-4 w-4" />
                      {items.length} 条
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                      <BookmarkCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </StaggerRevealItem>
      </StaggerReveal>
    </main>
  );
}

function FeaturedBookmarkCard({ item }: { item: PublicBookmarkItem }) {
  const logoUrl = item.logoUrl ?? getBookmarkFallbackLogoUrl(item.url);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group grid gap-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-zinc-300 hover:shadow-md dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)] dark:hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          {getBookmarkKindLabel(item.kind)}
        </div>
        <ArrowUpRight className="h-4 w-4 text-zinc-400 transition group-hover:text-zinc-950 dark:group-hover:text-zinc-50" />
      </div>
      <div className="flex items-start gap-4">
        <BookmarkLogo
          title={item.title}
          host={item.host}
          logoUrl={item.logoUrl}
          fallbackLogoUrl={logoUrl}
        />
        <div className="grid gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {item.title}
          </h3>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.summary}</p>
        </div>
      </div>
      <div className="grid gap-3">
        {item.note ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.note}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200/80 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

function BookmarkCard({ item }: { item: PublicBookmarkItem }) {
  const logoUrl = item.logoUrl ?? getBookmarkFallbackLogoUrl(item.url);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group grid gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-zinc-300 hover:shadow-md dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)] dark:hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {getBookmarkKindLabel(item.kind)}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {item.host}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {item.category.eyebrow ?? item.category.name}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-950 dark:group-hover:text-zinc-50" />
      </div>

      <div className="flex items-start gap-3">
        <BookmarkLogo
          title={item.title}
          host={item.host}
          logoUrl={item.logoUrl}
          fallbackLogoUrl={logoUrl}
        />
        <div className="grid gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {item.title}
          </h3>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.summary}</p>
          </div>
        </div>
      {item.note ? (
        <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
          {item.note}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-200/80 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
