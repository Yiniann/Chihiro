import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { highlightCodeBlocksInHtml } from "@/lib/code-highlighting";
import { getRenderedContentHtml, normalizeHtmlForHydration } from "@/lib/content";
import {
  getPublicStandalonePageBySlug,
  isPublicSiteUnavailableError,
  isUninstalledSiteError,
} from "@/server/public-content";

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

  try {
    page = await getPublicStandalonePageBySlug(slug);
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      {highlightedContentHtml ? (
        <div
          data-reading-progress-root
          className="reading-copy space-y-6 text-base leading-8 text-zinc-800 dark:text-zinc-200"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pageContentHtml }}
        />
      ) : (
        <div
          data-reading-progress-root
          className="reading-copy space-y-6 text-base leading-8 text-zinc-800 dark:text-zinc-200"
        >
          <p>暂无内容。</p>
        </div>
      )}
    </main>
  );
}
