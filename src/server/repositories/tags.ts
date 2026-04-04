import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type TagOption = {
  id: string;
  name: string;
  slug: string;
};

export type TagItem = TagOption & {
  createdAt: string;
  updatedAt: string;
  postCount: number;
  contentCount: number;
};

export async function listTags(): Promise<TagOption[]> {
  const tags = await prisma.tag.findMany({
    orderBy: [{ name: "asc" }],
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

export async function createTag(input: {
  name: string;
  slug: string;
}): Promise<TagItem> {
  const tag = await prisma.tag.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return mapTagRecord(tag);
}

export async function getTagByIdForAdmin(id: string): Promise<TagItem | null> {
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (!tag) {
    return null;
  }

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
    postCount: tag._count.posts,
    contentCount: tag._count.posts,
  };
}

export async function updateTagById(input: {
  id: string;
  name: string;
  slug: string;
}): Promise<TagItem> {
  const tag = await prisma.tag.update({
    where: { id: input.id },
    data: {
      name: input.name,
      slug: input.slug,
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
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
    postCount: tag._count.posts,
    contentCount: tag._count.posts,
  };
}

export async function deleteTagById(id: string): Promise<TagItem> {
  const tag = await prisma.$transaction(async (tx) => {
    const current = await tx.tag.findUnique({
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
      throw new Error("标签不存在。");
    }

    const posts = await tx.post.findMany({
      select: {
        id: true,
        publishedSnapshot: true,
        draftSnapshot: true,
      },
    });

    for (const post of posts) {
      const shouldUpdatePublishedSnapshot = snapshotReferencesTag(post.publishedSnapshot, id);
      const shouldUpdateDraftSnapshot = snapshotReferencesTag(post.draftSnapshot, id);

      if (!shouldUpdatePublishedSnapshot && !shouldUpdateDraftSnapshot) {
        continue;
      }

      const data: Prisma.PostUpdateInput = {};

      if (shouldUpdatePublishedSnapshot) {
        data.publishedSnapshot = stripTagFromSnapshot(post.publishedSnapshot, id);
      }

      if (shouldUpdateDraftSnapshot) {
        data.draftSnapshot = stripTagFromSnapshot(post.draftSnapshot, id);
      }

      await tx.post.update({
        where: { id: post.id },
        data,
      });
    }

    await tx.tag.delete({
      where: { id },
    });

    return current;
  });

  return mapTagRecord(tag);
}

function mapTagRecord(
  tag: Prisma.TagGetPayload<{
    include: {
      _count: {
        select: {
          posts: true;
        };
      };
    };
  }>,
): TagItem {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
    postCount: tag._count.posts,
    contentCount: tag._count.posts,
  };
}

function snapshotReferencesTag(snapshot: Prisma.JsonValue | null, tagId: string) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const tags = (snapshot as { tags?: Array<{ id?: unknown }> | null }).tags;

  return Boolean(
    Array.isArray(tags) &&
      tags.some((tag) => typeof tag === "object" && !Array.isArray(tag) && tag?.id === tagId),
  );
}

function stripTagFromSnapshot(snapshot: Prisma.JsonValue | null, tagId: string) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return Prisma.DbNull;
  }

  const tags = (snapshot as { tags?: Array<Record<string, unknown>> | null }).tags;

  if (!Array.isArray(tags)) {
    return snapshot as Prisma.InputJsonValue;
  }

  return {
    ...(snapshot as Record<string, unknown>),
    tags: tags.filter((tag) => tag && tag.id !== tagId),
  } as Prisma.InputJsonValue;
}
