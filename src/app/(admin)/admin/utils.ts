import { ContentStatus } from "@prisma/client";
import { getContentText } from "@/lib/content";
import { getPostPath } from "@/lib/routes";
import type { PostItem } from "@/server/repositories/posts";
import type { UpdateItem } from "@/server/repositories/updates";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/posts", label: "文章" },
  { href: "/admin/updates", label: "动态" },
  { href: "/admin/pages", label: "独立页面" },
  { href: "/admin/categories", label: "分类标签" },
  { href: "/admin/readers", label: "读者" },
  { href: "/admin/comments", label: "评论" },
  { href: "/admin/media", label: "媒体库" },
  { href: "/admin/trash", label: "回收站" },
  { href: "/admin/settings", label: "设置" },
] as const;

const ADMIN_TIME_ZONE = "Asia/Shanghai";

export function compareAdminDates(left: string | null | undefined, right: string | null | undefined) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;
  return leftTime - rightTime;
}

export function formatAdminDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatCompactAdminDate(value: string | null) {
  if (!value) {
    return "None";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminDateTime(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function getContentWordCount(posts: PostItem[], updates: UpdateItem[]) {
  return [...posts, ...updates].reduce((total, item) => {
    const text = getContentText(item.contentHtml, item.content);
    return total + countTextUnits(text);
  }, 0);
}

export function getSiteRuntimeDays(startedAt: string | null) {
  if (!startedAt) {
    return null;
  }

  const startTime = new Date(startedAt).getTime();

  if (Number.isNaN(startTime)) {
    return null;
  }

  const elapsedDays = Math.floor((Date.now() - startTime) / 86_400_000);
  return Math.max(1, elapsedDays + 1);
}

export function getPublishedCount(posts: PostItem[], updates: UpdateItem[]) {
  return (
    posts.filter((item) => item.status === ContentStatus.PUBLISHED).length +
    updates.filter((item) => item.status === ContentStatus.PUBLISHED).length
  );
}

export function getDraftCount(posts: PostItem[], updates: UpdateItem[]) {
  return (
    posts.filter((item) => item.status === ContentStatus.DRAFT).length +
    updates.filter((item) => item.status === ContentStatus.DRAFT).length
  );
}

export function getRecentItems(posts: PostItem[], updates: UpdateItem[]) {
  return [
    ...posts.map((item) => ({
      id: item.id,
      kind: "Post" as const,
      title: item.title,
      slug: item.slug,
      href: getPostPath({ slug: item.slug, categorySlug: item.category?.slug }),
      status: item.status,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })),
    ...updates.map((item) => ({
      id: item.id,
      kind: "Update" as const,
      title: item.title,
      href: "/updates",
      status: item.status,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })),
  ].sort((left, right) => compareAdminDates(right.updatedAt, left.updatedAt));
}

export function getDraftPosts(posts: PostItem[]) {
  return posts
    .filter((item) => item.status === ContentStatus.DRAFT)
    .sort((left, right) => compareAdminDates(right.updatedAt, left.updatedAt));
}

export function getDraftUpdates(updates: UpdateItem[]) {
  return updates
    .filter((item) => item.status === ContentStatus.DRAFT)
    .sort((left, right) => compareAdminDates(right.updatedAt, left.updatedAt));
}

function countTextUnits(value: string) {
  const hanCharacters = value.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const nonHanText = value.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ");
  const latinWords = nonHanText.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;

  return hanCharacters + latinWords;
}
