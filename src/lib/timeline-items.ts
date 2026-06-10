import { getContentPreview, getContentText } from "@/lib/content";
import { getPostPath, getUpdateAnchorPath } from "@/lib/routes";
import { getUpdateKindLabel, type UpdateKindValue } from "@/lib/update-kind";

export type TimelineSourceType = "all" | "posts" | "updates";

export type TimelineItem = {
  id: string | number;
  href?: string;
  title: string;
  publishedAt: string | null;
  categoryLabel: string;
  kindLabel: "Posts" | "Update" | "Movie" | "Music" | "Object";
  meta?: string;
  summary: string;
  searchText: string;
  authorName?: string | null;
};

type TimelinePost = {
  id: string | number;
  slug: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  content?: unknown;
  authorName?: string | null;
  category?: {
    slug?: string | null;
    name?: string | null;
  } | null;
  tags: Array<{
    name: string;
  }>;
  publishedAt: string | null;
};

type TimelineUpdate = {
  id: string | number;
  title: string;
  kind?: UpdateKindValue;
  contentHtml?: string | null;
  content?: unknown;
  authorName?: string | null;
  publishedAt: string | null;
};

const UPDATES_PER_PAGE = 10;

export function getTimelineItems(
  type: TimelineSourceType,
  posts: TimelinePost[],
  updates: TimelineUpdate[],
): TimelineItem[] {
  const postItems: TimelineItem[] = posts.map((post) => ({
    id: post.id,
    href: getPostPath({ slug: post.slug, categorySlug: post.category?.slug }),
    title: post.title,
    publishedAt: post.publishedAt,
    categoryLabel: post.category?.name ?? "Uncategorized",
    kindLabel: "Posts",
    meta: post.authorName ?? undefined,
    summary: post.summary ?? getContentPreview(post.contentHtml ?? null, post.content),
    searchText: [
      post.title,
      post.summary ?? "",
      post.category?.name ?? "",
      post.authorName ?? "",
      ...post.tags.map((tag) => tag.name),
      getContentText(post.contentHtml ?? null, post.content),
    ].join(" "),
  }));

  const updateItems: TimelineItem[] = updates.map((update, index) => {
    const numericUpdateId =
      typeof update.id === "number" ? update.id : Number.parseInt(String(update.id), 10);
    const updateKindLabel =
      update.kind === "NOTE" ? "动态" : update.kind ? getUpdateKindLabel(update.kind) : "动态";
    const updateKindBadge =
      update.kind === "MOVIE"
        ? "Movie"
        : update.kind === "MUSIC"
          ? "Music"
          : update.kind === "OBJECT"
            ? "Object"
            : "Update";

    return {
      id: update.id,
      href: getUpdateAnchorPath({
        updateId: Number.isFinite(numericUpdateId) ? numericUpdateId : index + 1,
        page: Math.floor(index / UPDATES_PER_PAGE) + 1,
      }),
      title: update.title,
      publishedAt: update.publishedAt,
      categoryLabel: updateKindLabel,
      kindLabel: updateKindBadge,
      meta: update.authorName ?? undefined,
      authorName: update.authorName,
      summary: getContentPreview(update.contentHtml ?? null, update.content),
      searchText: [
        update.title,
        updateKindBadge,
        updateKindLabel,
        update.authorName ?? "",
        getContentText(update.contentHtml ?? null, update.content),
      ].join(" "),
    };
  });

  const items =
    type === "posts"
      ? postItems
      : type === "updates"
        ? updateItems
        : [...postItems, ...updateItems];

  return items.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}
