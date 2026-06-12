import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PostComments } from "@/components/post-comments";
import { PostEngagement } from "@/components/post-engagement";
import { PostReadingPresenceRail } from "@/components/post-reading-presence-rail";
import { PostSidebarActions } from "@/components/post-sidebar-actions";
import { PostTableOfContents } from "@/components/post-table-of-contents";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { highlightCodeBlocksInHtml } from "@/lib/code-highlighting";
import { StaggerReveal, StaggerRevealItem } from "@/components/stagger-reveal";
import {
  addHeadingAnchors,
  getRenderedContentHtml,
  normalizeHtmlForHydration,
} from "@/lib/content";
import { getPostPath } from "@/lib/routes";
import { siteConfig } from "@/lib/site";
import { RelativeDate } from "@/components/relative-date";
import { auth } from "@/server/public-auth";
import {
  getPublicInteractionSettingsForSite,
  getPublicPostByCategoryAndSlug,
  getPublicPostBySlug,
  getPublicPostRouteParams,
  getPublicPostSlugs,
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
  isUninstalledSiteError,
} from "@/server/public-content";
import { getOwnerDisplayProfile } from "@/server/repositories/users";

type PostPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export const dynamic = "force-dynamic";

function getRouteState(segments: string[]) {
  if (segments.length === 1) {
    return {
      category: null,
      slug: segments[0],
    };
  }

  if (segments.length === 2) {
    return {
      category: segments[0],
      slug: segments[1],
    };
  }

  return null;
}

export async function generateStaticParams() {
  let routeParams;
  let slugs;

  try {
    [routeParams, slugs] = await Promise.all([
      getPublicPostRouteParams(),
      getPublicPostSlugs(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error) || isUninstalledSiteError(error)) {
      return [];
    }

    throw error;
  }

  return [
    ...routeParams.map(({ category, slug }) => ({ slug: [category, slug] })),
    ...slugs.map((slug) => ({ slug: [slug] })),
  ];
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  const routeState = getRouteState(segments);

  if (!routeState) {
    return {
      title: "Post not found",
    };
  }

  let post;

  try {
    post = await getPublicPostBySlug(routeState.slug);
  } catch (error) {
    if (isUninstalledSiteError(error)) {
      return {
        title: "Initialize Chihiro",
      };
    }

    if (isPublicSiteUnavailableError(error)) {
      return {
        title: "503 · Service Unavailable",
        description: "The site is temporarily unavailable because the database cannot be reached.",
      };
    }

    throw error;
  }

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.summary ?? undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug: segments } = await params;
  const routeState = getRouteState(segments);

  if (!routeState) {
    notFound();
  }

  try {
    if (!routeState.category) {
      const post = await getPublicPostBySlug(routeState.slug);

      if (!post) {
        notFound();
      }

      permanentRedirect(getPostPath({ slug: post.slug, categorySlug: post.category?.slug }));
    }

    const post = await getPublicPostByCategoryAndSlug(routeState.category, routeState.slug);

    if (!post) {
      const canonicalPost = await getPublicPostBySlug(routeState.slug);

      if (canonicalPost) {
        permanentRedirect(getPostPath({ slug: canonicalPost.slug, categorySlug: canonicalPost.category?.slug }));
      }

      notFound();
    }

    const renderedContentHtml = getRenderedContentHtml(post.contentHtml, post.content);
    const highlightedContentHtml = renderedContentHtml ? highlightCodeBlocksInHtml(renderedContentHtml) : null;
    const contentWithToc = highlightedContentHtml ? addHeadingAnchors(highlightedContentHtml) : null;
    const postContentHtml = normalizeHtmlForHydration(contentWithToc?.html ?? highlightedContentHtml ?? "");
    const tocItems = contentWithToc?.items ?? [];
    const postPath = getPostPath({ slug: post.slug, categorySlug: post.category?.slug });
    const [interactionSettings, siteSettings, publicSession, ownerProfile] = await Promise.all([
      getPublicInteractionSettingsForSite(),
      getPublicSiteSettings(),
      auth(),
      getOwnerDisplayProfile(),
    ]);
    const realtimePort = Number(process.env.REALTIME_PORT ?? 3001);
    const selfAvatarUrl =
      publicSession?.user?.role === "OWNER"
        ? ownerProfile?.image ?? publicSession.user.image ?? null
        : publicSession?.user?.image ?? null;

    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-16 sm:px-10">
        <StaggerReveal
          className="grid gap-12 lg:grid-cols-[minmax(0,48rem)_16rem] lg:items-start lg:justify-center"
          delayChildren={0.04}
          staggerChildren={0.08}
        >
          <article className="min-w-0">
            {siteSettings.postReadingPresenceEnabled ? (
              <PostReadingPresenceRail
                contentType="post"
                contentId={post.id}
                contentSlug={post.slug}
                pathname={postPath}
                realtimePort={realtimePort}
                selfAvatarUrl={selfAvatarUrl}
                selfDisplayName={publicSession?.user?.name ?? null}
              />
            ) : null}

            <StaggerRevealItem offset={20}>
              <h1 className="site-title-page text-center tracking-tight text-zinc-950 dark:text-zinc-50">
                {post.title}
              </h1>
            </StaggerRevealItem>

            <StaggerRevealItem offset={16}>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                <RelativeDate value={post.publishedAt} timeZone={siteSettings.timeZone ?? siteConfig.timeZone} />
                {post.updatedAt ? (
                  <span>
                    Updated <RelativeDate value={post.updatedAt} timeZone={siteSettings.timeZone ?? siteConfig.timeZone} />
                  </span>
                ) : null}
                <PostEngagement
                  postId={post.id}
                  initialViewCount={post.viewCount}
                  initialLikeCount={post.likeCount}
                />
              </div>
            </StaggerRevealItem>

            <StaggerRevealItem offset={16}>
              <div className="mt-4 flex flex-wrap gap-3">
                {post.category ? (
                  <Link
                    href={`/posts?category=${encodeURIComponent(post.category.slug)}`}
                    className="text-xs font-medium text-primary transition-colors hover:text-primary/75"
                  >
                    /{post.category.name}
                  </Link>
                ) : null}
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/posts?tag=${encodeURIComponent(tag.slug)}`}
                    className="text-xs font-medium text-zinc-500 transition-colors hover:text-primary dark:text-zinc-400"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </StaggerRevealItem>

            {post.summary ? (
              <StaggerRevealItem offset={18}>
                <p className="reading-copy site-lead mt-6 text-zinc-600 dark:text-zinc-300">
                  {post.summary}
                </p>
              </StaggerRevealItem>
            ) : null}

            <StaggerRevealItem offset={22}>
              {renderedContentHtml ? (
                <div
                  data-reading-progress-root
                  className="reading-copy site-body mt-10 space-y-6 text-zinc-800 dark:text-zinc-200"
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: postContentHtml }}
                />
              ) : (
                <div
                  data-reading-progress-root
                  className="reading-copy site-body mt-10 space-y-6 text-zinc-800 dark:text-zinc-200"
                >
                  <p>暂无内容。</p>
                </div>
              )}
            </StaggerRevealItem>

            <StaggerRevealItem offset={18}>
              <div
                className="mt-12 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80"
                aria-hidden="true"
              >
                <span className="h-px flex-1 border-t border-dashed border-primary/45" />
                <span>end</span>
                <span className="h-px flex-1 border-t border-dashed border-primary/45" />
              </div>
            </StaggerRevealItem>

            <StaggerRevealItem offset={22}>
              <PostComments
                targetType="post"
                targetId={post.id}
                pathname={postPath}
                commentsEnabled={post.commentsEnabled}
              />
            </StaggerRevealItem>
          </article>

          <PostTableOfContents items={tocItems}>
            <StaggerRevealItem offset={18}>
              <PostSidebarActions
                postId={post.id}
                title={post.title}
                initialLikeCount={post.likeCount}
                siteName={siteSettings.siteName ?? siteConfig.name}
                subscriptionsEnabled={interactionSettings.subscriptionsEnabled}
              />
            </StaggerRevealItem>
          </PostTableOfContents>
        </StaggerReveal>
      </main>
    );
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }
}
