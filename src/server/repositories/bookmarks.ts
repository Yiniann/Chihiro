import { BookmarkKind, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { getBookmarkHost } from "@/lib/bookmarks";

export type BookmarkCategorySummary = {
  id: number;
  name: string;
  slug: string;
  eyebrow: string | null;
  description: string | null;
  sortOrder: number;
};

export type BookmarkItem = {
  id: number;
  title: string;
  url: string;
  host: string;
  summary: string;
  note: string | null;
  category: BookmarkCategorySummary;
  kind: BookmarkKind;
  tags: string[];
  sortOrder: number;
  isVisible: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaveBookmarkInput = {
  id?: number;
  title: string;
  url: string;
  summary: string;
  note: string | null;
  categoryId: number;
  kind: BookmarkKind;
  tags: string[];
  sortOrder: number;
  isVisible: boolean;
  isFeatured: boolean;
};

export async function listBookmarksForAdmin(): Promise<BookmarkItem[]> {
  const items = await prisma.bookmark.findMany({
    include: {
      category: true,
    },
    orderBy: [
      { isVisible: Prisma.SortOrder.desc },
      { category: { sortOrder: Prisma.SortOrder.asc } },
      { sortOrder: Prisma.SortOrder.asc },
      { updatedAt: Prisma.SortOrder.desc },
      { title: Prisma.SortOrder.asc },
    ],
  });

  return items.map(mapBookmarkRecord);
}

export async function listPublicBookmarks(): Promise<BookmarkItem[]> {
  const items = await prisma.bookmark.findMany({
    where: {
      isVisible: true,
    },
    include: {
      category: true,
    },
    orderBy: [
      { category: { sortOrder: Prisma.SortOrder.asc } },
      { sortOrder: Prisma.SortOrder.asc },
      { updatedAt: Prisma.SortOrder.desc },
      { title: Prisma.SortOrder.asc },
    ],
  });

  return items.map(mapBookmarkRecord);
}

export async function getBookmarkByIdForAdmin(id: number): Promise<BookmarkItem | null> {
  const item = await prisma.bookmark.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  return item ? mapBookmarkRecord(item) : null;
}

export async function createBookmark(input: SaveBookmarkInput): Promise<BookmarkItem> {
  const item = await prisma.bookmark.create({
    data: {
      title: input.title,
      url: input.url,
      summary: input.summary,
      note: input.note,
      categoryId: input.categoryId,
      kind: input.kind,
      tags: input.tags,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
      isFeatured: input.isFeatured,
    },
    include: {
      category: true,
    },
  });

  return mapBookmarkRecord(item);
}

export async function updateBookmark(input: SaveBookmarkInput & { id: number }): Promise<BookmarkItem> {
  const item = await prisma.bookmark.update({
    where: { id: input.id },
    data: {
      title: input.title,
      url: input.url,
      summary: input.summary,
      note: input.note,
      categoryId: input.categoryId,
      kind: input.kind,
      tags: input.tags,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
      isFeatured: input.isFeatured,
    },
    include: {
      category: true,
    },
  });

  return mapBookmarkRecord(item);
}

export async function deleteBookmarkById(id: number): Promise<BookmarkItem> {
  const item = await prisma.bookmark.delete({
    where: { id },
    include: {
      category: true,
    },
  });

  return mapBookmarkRecord(item);
}

function mapBookmarkRecord(
  record: Prisma.BookmarkGetPayload<{
    include: {
      category: true;
    };
  }>,
): BookmarkItem {
  return {
    id: record.id,
    title: record.title,
    url: record.url,
    host: getBookmarkHost(record.url),
    summary: record.summary,
    note: record.note,
    category: {
      id: record.category.id,
      name: record.category.name,
      slug: record.category.slug,
      eyebrow: record.category.eyebrow,
      description: record.category.description,
      sortOrder: record.category.sortOrder,
    },
    kind: record.kind,
    tags: record.tags,
    sortOrder: record.sortOrder,
    isVisible: record.isVisible,
    isFeatured: record.isFeatured,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
