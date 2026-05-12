"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { PostCommentForm } from "@/components/post-comment-form";
import type { PublicPostComment } from "@/server/repositories/comments";

type PostCommentListProps = {
  comments: PublicPostComment[];
  canComment: boolean;
  postId: number;
  pathname: string;
  showGuestFields: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function PostCommentList({
  comments,
  canComment,
  postId,
  pathname,
  showGuestFields,
  user,
}: PostCommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        还没有公开评论。
      </p>
    );
  }

  return (
    <div className="grid gap-1">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          canComment={canComment}
          postId={postId}
          pathname={pathname}
          showGuestFields={showGuestFields}
          user={user}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  canComment,
  postId,
  pathname,
  showGuestFields,
  user,
}: {
  comment: PublicPostComment;
  depth: number;
  canComment: boolean;
  postId: number;
  pathname: string;
  showGuestFields: boolean;
  user: PostCommentListProps["user"];
}) {
  const [isReplying, setIsReplying] = useState(false);
  const isNested = depth > 0;
  const replies = isNested ? [] : comment.replies;

  return (
    <article className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-zinc-200/70 py-4 first:pt-0 last:border-b-0 dark:border-zinc-800/70">
      <div className="pt-0.5">
        <CommentAvatar comment={comment} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {comment.author.name}
          </p>
          <time className="text-xs text-zinc-400 dark:text-zinc-500" dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </time>
        </div>
        {isNested && comment.parentAuthorName ? (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            回复 {comment.parentAuthorName}
          </p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {comment.body}
        </p>

        {canComment ? (
          <button
            type="button"
            onClick={() => setIsReplying((current) => !current)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-primary dark:text-zinc-500 dark:hover:text-primary"
          >
            {isReplying ? <X className="size-3.5" /> : <MessageCircle className="size-3.5" />}
            {isReplying ? "取消回复" : "回复"}
          </button>
        ) : null}

        {isReplying ? (
          <div className="mt-3">
            <PostCommentForm
              postId={postId}
              parentId={comment.id}
              pathname={pathname}
              showGuestFields={showGuestFields}
              compact
              placeholder={`回复 ${comment.author.name}...`}
              submitLabel="回复"
              user={user}
              onSuccess={() => setIsReplying(false)}
            />
          </div>
        ) : null}

        {replies.length > 0 ? (
          <div className="mt-4 grid gap-0 border-l border-zinc-200/80 pl-4 dark:border-zinc-800/80">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={1}
                canComment={canComment}
                postId={postId}
                pathname={pathname}
                showGuestFields={showGuestFields}
                user={user}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CommentAvatar({ comment }: { comment: PublicPostComment }) {
  if (comment.author.image) {
    return (
      <span
        className="block size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
        style={{ backgroundImage: `url(${comment.author.image})` }}
      />
    );
  }

  return (
    <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
      {comment.author.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
