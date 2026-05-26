import { CommentStatus, ContentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type CommentTargetType = "post" | "standalone-page";

export type PublicPostComment = {
  id: string;
  parentId: string | null;
  threadRootId: string | null;
  parentAuthorName: string | null;
  body: string;
  createdAt: string;
  author: {
    name: string;
    image: string | null;
    role: "OWNER" | "ADMIN" | "USER" | null;
  };
  replies: PublicPostComment[];
};

const adminCommentInclude = {
  post: {
    select: {
      id: true,
      title: true,
      slug: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
  },
  standalonePage: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
  user: {
    select: {
      name: true,
      email: true,
      image: true,
    },
  },
  parent: {
    select: {
      id: true,
      body: true,
      authorName: true,
      authorEmail: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
} as const satisfies Prisma.PostCommentInclude;

type AdminCommentRecord = Prisma.PostCommentGetPayload<{
  include: typeof adminCommentInclude;
}>;

export type AdminCommentStatusFilter = "all" | "pending" | "approved" | "spam";

export type AdminCommentItem = {
  id: string;
  parentId: string | null;
  threadRootId: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string | null;
    image: string | null;
    source: "user" | "guest";
  };
  target: {
    type: CommentTargetType;
    id: number;
    title: string;
    href: string;
  };
  parent: {
    id: string;
    authorName: string;
    body: string;
  } | null;
};

export type AdminCommentStats = {
  total: number;
  pending: number;
  approved: number;
  spam: number;
};

export async function listCommentsForAdmin(
  filter: AdminCommentStatusFilter = "all",
): Promise<AdminCommentItem[]> {
  const comments = await prisma.postComment.findMany({
    where: getAdminCommentWhere(filter),
    include: adminCommentInclude,
    orderBy:
      filter === "all"
        ? [{ status: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.desc }]
        : [{ createdAt: Prisma.SortOrder.desc }],
  });

  return comments.map(mapAdminCommentRecord);
}

export async function getCommentStatsForAdmin(): Promise<AdminCommentStats> {
  const [total, pending, approved, spam] = await Promise.all([
    prisma.postComment.count(),
    prisma.postComment.count({ where: { status: CommentStatus.PENDING } }),
    prisma.postComment.count({ where: { status: CommentStatus.APPROVED } }),
    prisma.postComment.count({ where: { status: CommentStatus.SPAM } }),
  ]);

  return {
    total,
    pending,
    approved,
    spam,
  };
}

export async function updateCommentStatus(id: string, status: CommentStatus) {
  return prisma.postComment.update({
    where: { id },
    data: { status },
    select: { id: true },
  });
}

export async function deleteComment(id: string) {
  return prisma.postComment.delete({
    where: { id },
    select: { id: true },
  });
}

export async function listApprovedCommentsForTarget(target: {
  type: CommentTargetType;
  id: number;
}): Promise<PublicPostComment[]> {
  const comments = await prisma.postComment.findMany({
    where: {
      ...(target.type === "post" ? { postId: target.id } : { standalonePageId: target.id }),
      status: CommentStatus.APPROVED,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      parentId: true,
      threadRootId: true,
      body: true,
      createdAt: true,
      authorName: true,
      parent: {
        select: {
          authorName: true,
          authorEmail: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  return buildCommentThreads(
    comments.map((comment) => ({
      id: comment.id,
      parentId: comment.parentId,
      threadRootId: comment.threadRootId,
      parentAuthorName:
        comment.parent?.user?.name ??
        comment.parent?.user?.email ??
        comment.parent?.authorName ??
        comment.parent?.authorEmail ??
        null,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: {
        name: comment.user?.name ?? comment.user?.email ?? comment.authorName ?? "访客",
        image: comment.user?.image ?? null,
        role: comment.user?.role ?? null,
      },
      replies: [],
    })),
  );
}

export async function listApprovedCommentsForPost(postId: number) {
  return listApprovedCommentsForTarget({ type: "post", id: postId });
}

export async function createCommentForPost({
  targetType,
  targetId,
  userId,
  parentId,
  authorName,
  authorEmail,
  body,
  requiresModeration,
}: {
  targetType: CommentTargetType;
  targetId: number;
  userId: string | null;
  parentId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  requiresModeration: boolean;
}) {
  const targetExists =
    targetType === "post"
      ? await prisma.post.findFirst({
          where: {
            id: targetId,
            status: ContentStatus.PUBLISHED,
            commentsEnabled: true,
          },
          select: { id: true },
        })
      : await prisma.standalonePage.findFirst({
          where: {
            id: targetId,
            status: ContentStatus.PUBLISHED,
            commentsEnabled: true,
          },
          select: { id: true },
        });

  if (!targetExists) {
    throw new Error(
      targetType === "post"
        ? "文章不存在、尚未发布，或暂未开放评论。"
        : "页面不存在、尚未发布，或暂未开放评论。",
    );
  }

  if (parentId) {
    const parentComment = await prisma.postComment.findFirst({
      where: {
        id: parentId,
        ...(targetType === "post" ? { postId: targetId } : { standalonePageId: targetId }),
      },
      select: {
        id: true,
        threadRootId: true,
      },
    });

    if (!parentComment) {
      throw new Error("被回复的评论不存在。");
    }

    const threadRootId = parentComment.threadRootId ?? parentComment.id;
    const data: Prisma.PostCommentUncheckedCreateInput = {
      ...(targetType === "post" ? { postId: targetId } : { standalonePageId: targetId }),
      parentId,
      threadRootId,
      userId,
      authorName,
      authorEmail,
      body,
      status: requiresModeration ? CommentStatus.PENDING : CommentStatus.APPROVED,
    };

    return prisma.postComment.create({
      data,
      select: {
        id: true,
        status: true,
      },
    });
  }

  const data: Prisma.PostCommentUncheckedCreateInput = {
    ...(targetType === "post" ? { postId: targetId } : { standalonePageId: targetId }),
    parentId,
    userId,
    authorName,
    authorEmail,
    body,
    status: requiresModeration ? CommentStatus.PENDING : CommentStatus.APPROVED,
  };

  return prisma.postComment.create({
    data,
    select: {
      id: true,
      status: true,
    },
  });
}

function getAdminCommentWhere(filter: AdminCommentStatusFilter): Prisma.PostCommentWhereInput {
  if (filter === "pending") {
    return { status: CommentStatus.PENDING };
  }

  if (filter === "approved") {
    return { status: CommentStatus.APPROVED };
  }

  if (filter === "spam") {
    return { status: CommentStatus.SPAM };
  }

  return {};
}

function mapAdminCommentRecord(comment: AdminCommentRecord): AdminCommentItem {
  const userName = comment.user?.name ?? comment.user?.email ?? null;
  const guestName = comment.authorName?.trim() || comment.authorEmail?.trim() || null;
  const parentUserName = comment.parent?.user?.name ?? comment.parent?.user?.email ?? null;
  const parentGuestName =
    comment.parent?.authorName?.trim() || comment.parent?.authorEmail?.trim() || null;
  const categorySlug = comment.post?.category?.slug;
  const target =
    comment.post
      ? {
          type: "post" as const,
          id: comment.post.id,
          title: comment.post.title,
          href: `/posts/${categorySlug?.trim() || "uncategorized"}/${comment.post.slug}`,
        }
      : comment.standalonePage
        ? {
            type: "standalone-page" as const,
            id: comment.standalonePage.id,
            title: comment.standalonePage.title,
            href: `/${comment.standalonePage.slug}`,
          }
        : null;

  if (!target) {
    throw new Error(`Comment target missing: ${comment.id}`);
  }

  return {
    id: comment.id,
    parentId: comment.parentId,
    threadRootId: comment.threadRootId,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      name: userName ?? guestName ?? "访客",
      email: comment.user?.email ?? comment.authorEmail ?? null,
      image: comment.user?.image ?? null,
      source: comment.userId ? "user" : "guest",
    },
    target,
    parent: comment.parent
      ? {
          id: comment.parent.id,
          authorName: parentUserName ?? parentGuestName ?? "访客",
          body: comment.parent.body,
        }
      : null,
  };
}

function buildCommentThreads(comments: PublicPostComment[]) {
  const roots: PublicPostComment[] = [];
  const repliesByRootId = new Map<string, PublicPostComment[]>();

  for (const comment of comments) {
    comment.replies = [];

    if (!comment.threadRootId) {
      roots.push(comment);
      continue;
    }

    const replies = repliesByRootId.get(comment.threadRootId) ?? [];
    replies.push(comment);
    repliesByRootId.set(comment.threadRootId, replies);
  }

  for (const root of roots) {
    root.replies = repliesByRootId.get(root.id) ?? [];
  }

  return roots;
}
