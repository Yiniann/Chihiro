import { getPostPath } from "@/lib/routes";
import { homeSections } from "@/lib/home-sections";
import { moreSections } from "@/lib/more-sections";
import { canonicalUrl } from "@/lib/site";
import {
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
  isUninstalledSiteError,
  listPublicPosts,
} from "@/server/public-content";

export async function GET() {
  let posts;
  let siteSettings;

  try {
    [posts, siteSettings] = await Promise.all([listPublicPosts(), getPublicSiteSettings()]);
  } catch (error) {
    if (isUninstalledSiteError(error)) {
      return new Response("404 · Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    if (isPublicSiteUnavailableError(error)) {
      return new Response("503 · Service Unavailable", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    throw error;
  }

  const toCanonical = (path: string) => canonicalUrl(path, siteSettings);

  const staticRoutes = [
    toCanonical("/"),
    ...homeSections.map((section) => toCanonical(section.href)),
    toCanonical("/posts"),
    toCanonical("/updates"),
    toCanonical("/timeline"),
    toCanonical("/more"),
    ...moreSections.map((section) => toCanonical(section.href)),
  ];

  const postRoutes = posts.map((post) =>
    toCanonical(getPostPath({ slug: post.slug, categorySlug: post.category?.slug })),
  );

  const urls = [...staticRoutes, ...postRoutes];
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${now}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
