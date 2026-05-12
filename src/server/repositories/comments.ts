import { CommentStatus, ContentStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type PublicPostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    name: string;
    image: string | null;
  };
};

export async function listApprovedCommentsForPost(postId: number): Promise<PublicPostComment[]> {
  const comments = await prisma.postComment.findMany({
    where: {
      postId,
      status: CommentStatus.APPROVED,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorName: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: {
      name: comment.user?.name ?? comment.user?.email ?? comment.authorName ?? "访客",
      image: comment.user?.image ?? null,
    },
  }));
}

export async function createCommentForPost({
  postId,
  userId,
  authorName,
  authorEmail,
  body,
  requiresModeration,
}: {
  postId: number;
  userId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  requiresModeration: boolean;
}) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      status: ContentStatus.PUBLISHED,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    throw new Error("文章不存在或尚未发布。");
  }

  return prisma.postComment.create({
    data: {
      postId,
      userId,
      authorName,
      authorEmail,
      body,
      status: requiresModeration ? CommentStatus.PENDING : CommentStatus.APPROVED,
    },
    select: {
      id: true,
      status: true,
    },
  });
}
