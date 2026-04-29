import { CategoryKind, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type CategoryOption = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  contentCount: number;
};

export async function listPostCategories(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    where: { kind: CategoryKind.POST },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    contentCount: category._count.posts,
  }));
}

export async function getCategoryByIdForAdmin(id: number): Promise<CategoryOption | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    contentCount: category._count.posts,
  };
}

export async function updateCategoryById(input: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}): Promise<CategoryOption> {
  const category = await prisma.$transaction(async (tx) => {
    const updatedCategory = await tx.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const posts = await tx.post.findMany({
      where: {
        OR: [
          { categoryId: input.id },
          {
            publishedSnapshot: {
              path: ["category", "id"],
              equals: input.id,
            },
          },
          {
            draftSnapshot: {
              path: ["category", "id"],
              equals: input.id,
            },
          },
        ],
      },
      select: {
        id: true,
        publishedSnapshot: true,
        draftSnapshot: true,
      },
    });

    for (const post of posts) {
      const nextPublishedSnapshot = updateCategoryInSnapshot(post.publishedSnapshot, updatedCategory);
      const nextDraftSnapshot = updateCategoryInSnapshot(post.draftSnapshot, updatedCategory);

      if (
        nextPublishedSnapshot === post.publishedSnapshot &&
        nextDraftSnapshot === post.draftSnapshot
      ) {
        continue;
      }

      const data: Prisma.PostUpdateInput = {};

      if (nextPublishedSnapshot !== post.publishedSnapshot) {
        data.publishedSnapshot = nextPublishedSnapshot as Prisma.InputJsonValue;
      }

      if (nextDraftSnapshot !== post.draftSnapshot) {
        data.draftSnapshot = nextDraftSnapshot as Prisma.InputJsonValue;
      }

      await tx.post.update({
        where: { id: post.id },
        data,
      });
    }

    return updatedCategory;
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    contentCount: category._count.posts,
  };
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description: string | null;
}): Promise<CategoryOption> {
  const category = await prisma.category.create({
    data: {
      kind: CategoryKind.POST,
      name: input.name,
      slug: input.slug,
      description: input.description,
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    contentCount: category._count.posts,
  };
}

export async function deleteCategoryById(id: number): Promise<CategoryOption> {
  const category = await prisma.$transaction(async (tx) => {
    const current = await tx.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!current) {
      throw new Error("分类不存在。");
    }

    await tx.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    const posts = await tx.post.findMany({
      select: {
        id: true,
        categoryId: true,
        publishedSnapshot: true,
        draftSnapshot: true,
      },
    });

    for (const post of posts) {
      const shouldClearPublishedSnapshot =
        post.categoryId === id || snapshotReferencesCategory(post.publishedSnapshot, id);
      const shouldClearDraftSnapshot = snapshotReferencesCategory(post.draftSnapshot, id);

      if (!shouldClearPublishedSnapshot && !shouldClearDraftSnapshot) {
        continue;
      }

      const data: Prisma.PostUpdateInput = {};

      if (shouldClearPublishedSnapshot) {
        data.publishedSnapshot = stripCategoryFromSnapshot(post.publishedSnapshot);
      }

      if (shouldClearDraftSnapshot) {
        data.draftSnapshot = stripCategoryFromSnapshot(post.draftSnapshot);
      }

      await tx.post.update({
        where: { id: post.id },
        data,
      });
    }

    await tx.category.delete({
      where: { id },
    });

    return current;
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    contentCount: category._count.posts,
  };
}

function snapshotReferencesCategory(snapshot: Prisma.JsonValue | null, categoryId: number) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const category = (snapshot as { category?: { id?: unknown } | null }).category;

  return Boolean(
    category &&
      typeof category === "object" &&
      !Array.isArray(category) &&
      Number((category as { id?: unknown }).id) === categoryId,
  );
}

function stripCategoryFromSnapshot(snapshot: Prisma.JsonValue | null) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return Prisma.DbNull;
  }

  return {
    ...(snapshot as Record<string, unknown>),
    category: null,
  } as Prisma.InputJsonValue;
}

function updateCategoryInSnapshot(
  snapshot: Prisma.JsonValue | null,
  category: { id: number; name: string; slug: string },
) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return snapshot;
  }

  const currentCategory = (snapshot as { category?: { id?: unknown } | null }).category;

  if (
    !currentCategory ||
    typeof currentCategory !== "object" ||
    Array.isArray(currentCategory) ||
    Number((currentCategory as { id?: unknown }).id) !== category.id
  ) {
    return snapshot;
  }

  return {
    ...(snapshot as Record<string, unknown>),
    category: {
      ...(currentCategory as Record<string, unknown>),
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
  } as Prisma.InputJsonValue;
}
