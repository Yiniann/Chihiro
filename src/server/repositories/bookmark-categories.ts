import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type BookmarkCategoryItem = {
  id: number;
  name: string;
  slug: string;
  eyebrow: string | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  bookmarkCount: number;
};

export async function listBookmarkCategoriesForAdmin(): Promise<BookmarkCategoryItem[]> {
  const items = await prisma.bookmarkCategoryItem.findMany({
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
    orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { name: Prisma.SortOrder.asc }],
  });

  return items.map(mapBookmarkCategoryRecord);
}

export async function listPublicBookmarkCategories(): Promise<BookmarkCategoryItem[]> {
  const items = await prisma.bookmarkCategoryItem.findMany({
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
    orderBy: [{ sortOrder: Prisma.SortOrder.asc }, { name: Prisma.SortOrder.asc }],
  });

  return items.map(mapBookmarkCategoryRecord);
}

export async function getBookmarkCategoryByIdForAdmin(
  id: number,
): Promise<BookmarkCategoryItem | null> {
  const item = await prisma.bookmarkCategoryItem.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return item ? mapBookmarkCategoryRecord(item) : null;
}

export async function createBookmarkCategory(input: {
  name: string;
  slug: string;
  eyebrow: string | null;
  description: string | null;
  sortOrder: number;
}): Promise<BookmarkCategoryItem> {
  const item = await prisma.bookmarkCategoryItem.create({
    data: input,
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return mapBookmarkCategoryRecord(item);
}

export async function updateBookmarkCategoryById(input: {
  id: number;
  name: string;
  slug: string;
  eyebrow: string | null;
  description: string | null;
  sortOrder: number;
}): Promise<BookmarkCategoryItem> {
  const item = await prisma.bookmarkCategoryItem.update({
    where: { id: input.id },
    data: {
      name: input.name,
      slug: input.slug,
      eyebrow: input.eyebrow,
      description: input.description,
      sortOrder: input.sortOrder,
    },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return mapBookmarkCategoryRecord(item);
}

export async function deleteBookmarkCategoryById(id: number): Promise<BookmarkCategoryItem> {
  const item = await prisma.bookmarkCategoryItem.delete({
    where: { id },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return mapBookmarkCategoryRecord(item);
}

function mapBookmarkCategoryRecord(
  item: Prisma.BookmarkCategoryItemGetPayload<{
    include: {
      _count: {
        select: {
          bookmarks: true;
        };
      };
    };
  }>,
): BookmarkCategoryItem {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    eyebrow: item.eyebrow,
    description: item.description,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    bookmarkCount: item._count.bookmarks,
  };
}
