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
              <p className="site-eyebrow uppercase tracking-[0.28em] text-n-5">
                {section.eyebrow}
              </p>
              <h1 className="site-title-page mt-4 flex flex-wrap items-baseline gap-3 tracking-tight text-n-6">
                <span>{section.title}</span>
                <span className="site-body tracking-normal text-n-4">
                  ·
                </span>
                <span className="site-body tracking-normal text-n-5">
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
                  <p className="site-eyebrow uppercase tracking-[0.24em] text-n-4">
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
              <div className="surface-shell site-body rounded-2xl px-6 py-10 text-n-5 dark:text-n-5">
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
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-n-2 pb-4 dark:border-n-2">
                    <div className="grid gap-1">
                      <p className="site-eyebrow uppercase tracking-[0.24em] text-n-4">
                        {category.eyebrow ?? category.name}
                      </p>
                      <h2 className="site-title-h2 tracking-tight text-n-6">
                        {category.name}
                      </h2>
                      <p className="site-body max-w-2xl text-n-5">
                        {category.description}
                      </p>
                    </div>
                    <div className="badge badge-soft">
                      <Layers3 className="h-3 w-3" />
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
      className="surface-shell surface-shell-hover group grid gap-5 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="site-eyebrow inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          {getBookmarkKindLabel(item.kind)}
        </div>
        <ArrowUpRight className="h-4 w-4 text-n-4 transition group-hover:text-n-6 dark:group-hover:text-n-6" />
      </div>
      <div className="flex items-start gap-4">
        <BookmarkLogo
          title={item.title}
          host={item.host}
          logoUrl={item.logoUrl}
          fallbackLogoUrl={logoUrl}
        />
        <div className="grid gap-3">
          <h3 className="site-title-h3 tracking-tight text-n-6">
            {item.title}
          </h3>
          <p className="site-body text-n-5">{item.summary}</p>
        </div>
      </div>
      <div className="grid gap-3">
        {item.note ? (
          <p className="site-meta text-n-5">{item.note}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="site-eyebrow tag tag-accent"
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
      className="surface-shell surface-shell-hover group grid gap-4 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="site-eyebrow tag tag-accent uppercase tracking-[0.18em]">
            {getBookmarkKindLabel(item.kind)}
          </span>
          <span className="site-eyebrow uppercase tracking-[0.18em] text-n-4">
            {item.host}
          </span>
          <span className="site-eyebrow uppercase tracking-[0.18em] text-n-4">
            {item.category.eyebrow ?? item.category.name}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-n-4 transition group-hover:text-n-6 dark:group-hover:text-n-6" />
      </div>

      <div className="flex items-start gap-3">
        <BookmarkLogo
          title={item.title}
          host={item.host}
          logoUrl={item.logoUrl}
          fallbackLogoUrl={logoUrl}
        />
        <div className="grid gap-3">
          <h3 className="site-title-h3 tracking-tight text-n-6">
            {item.title}
          </h3>
          <p className="site-body text-n-5">{item.summary}</p>
          </div>
        </div>
      {item.note ? (
        <p className="site-meta rounded-2xl bg-n-1 px-4 py-3 text-n-5 dark:bg-n-1/80 dark:text-n-5">
          {item.note}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="site-eyebrow tag tag-accent"
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
