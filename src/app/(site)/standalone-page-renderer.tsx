import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/server/public-auth";
import { PostReadingPresenceRail } from "@/components/post-reading-presence-rail";
import { PostComments } from "@/components/post-comments";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { highlightCodeBlocksInHtml } from "@/lib/code-highlighting";
import { getRenderedContentHtml, normalizeHtmlForHydration } from "@/lib/content";
import {
  getPublicSiteSettings,
  getPublicStandalonePageBySlug,
  isPublicSiteUnavailableError,
  isUninstalledSiteError,
} from "@/server/public-content";
import { getOwnerDisplayProfile } from "@/server/repositories/users";

export async function generateStandalonePageMetadata(slug: string): Promise<Metadata> {
  let page;

  try {
    page = await getPublicStandalonePageBySlug(slug);
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

  if (!page) {
    return {
      title: "Page not found",
    };
  }

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export async function StandalonePageRenderer({ slug }: { slug: string }) {
  let page;
  let siteSettings;
  let publicSession;
  let ownerProfile;

  try {
    [page, siteSettings, publicSession, ownerProfile] = await Promise.all([
      getPublicStandalonePageBySlug(slug),
      getPublicSiteSettings(),
      auth(),
      getOwnerDisplayProfile(),
    ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  if (!page) {
    notFound();
  }

  const renderedContentHtml = getRenderedContentHtml(page.contentHtml, page.content);
  const highlightedContentHtml = renderedContentHtml
    ? highlightCodeBlocksInHtml(renderedContentHtml)
    : null;
  const pageContentHtml = normalizeHtmlForHydration(highlightedContentHtml ?? "");
  const realtimePort = Number(process.env.REALTIME_PORT ?? 3001);
  const selfAvatarUrl =
    publicSession?.user?.role === "OWNER"
      ? ownerProfile?.image ?? publicSession.user.image ?? null
      : publicSession?.user?.image ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      {siteSettings.standalonePageReadingPresenceEnabled ? (
        <PostReadingPresenceRail
          contentType="standalone-page"
          contentId={page.id}
          contentSlug={page.slug}
          pathname={`/${page.slug}`}
          realtimePort={realtimePort}
          selfAvatarUrl={selfAvatarUrl}
          selfDisplayName={publicSession?.user?.name ?? null}
        />
      ) : null}
      {highlightedContentHtml ? (
        <div
          data-reading-progress-root
          className="reading-copy site-body space-y-6 text-zinc-800 dark:text-zinc-200"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pageContentHtml }}
        />
      ) : (
        <div
          data-reading-progress-root
          className="reading-copy site-body space-y-6 text-zinc-800 dark:text-zinc-200"
        >
          <p>暂无内容。</p>
        </div>
      )}
      <PostComments
        targetType="standalone-page"
        targetId={page.id}
        pathname={`/${page.slug}`}
        commentsEnabled={page.commentsEnabled}
      />
    </main>
  );
}
