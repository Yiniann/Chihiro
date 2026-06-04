import { BookmarkKind } from "@prisma/client";

export const bookmarkKindOptions = [
  { value: BookmarkKind.DOCS, label: "Docs" },
  { value: BookmarkKind.ARTICLE, label: "Article" },
  { value: BookmarkKind.TOOL, label: "Tool" },
  { value: BookmarkKind.COLLECTION, label: "Collection" },
] as const;

export function getBookmarkKindLabel(kind: BookmarkKind) {
  return bookmarkKindOptions.find((item) => item.value === kind)?.label ?? kind;
}

export function getBookmarkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function normalizeBookmarkUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("请填写 url。");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    throw new Error("请填写有效的 url。");
  }
}

export function parseBookmarkTags(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function formatBookmarkTags(tags: string[]) {
  return tags.join(", ");
}
