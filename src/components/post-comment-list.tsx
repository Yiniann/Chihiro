"use client";

import { MessageCircle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo, useState } from "react";
import { PostCommentForm } from "@/components/post-comment-form";
import type { CommentTargetType, PublicPostComment } from "@/server/repositories/comments";

type PostCommentListProps = {
  comments: PublicPostComment[];
  canComment: boolean;
  targetType: CommentTargetType;
  targetId: number;
  pathname: string;
  showGuestFields: boolean;
  ownerAvatarUrl?: string | null;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: "github" | "google" | "credentials" | null;
  } | null;
};

export function PostCommentList({
  comments,
  canComment,
  targetType,
  targetId,
  pathname,
  showGuestFields,
  ownerAvatarUrl,
  user,
}: PostCommentListProps) {
  const [sortOrder, setSortOrder] = useState<"latest" | "earliest">("latest");
  const totalComments = useMemo(() => countComments(comments), [comments]);
  const sortedComments = useMemo(
    () => sortComments(comments, sortOrder),
    [comments, sortOrder],
  );

  if (comments.length === 0) {
    return (
      <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        还没有公开评论。
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          共 {totalComments} 条评论
        </p>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setSortOrder("latest")}
            className={`border-b border-transparent px-0 py-1 transition ${
              sortOrder === "latest"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            最新
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("earliest")}
            className={`border-b border-transparent px-0 py-1 transition ${
              sortOrder === "earliest"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            最早
          </button>
        </div>
      </div>

      <div className="grid gap-1">
        {sortedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          canComment={canComment}
          targetType={targetType}
          targetId={targetId}
          pathname={pathname}
          showGuestFields={showGuestFields}
          ownerAvatarUrl={ownerAvatarUrl}
          user={user}
        />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  canComment,
  targetType,
  targetId,
  pathname,
  showGuestFields,
  ownerAvatarUrl,
  user,
}: {
  comment: PublicPostComment;
  depth: number;
  canComment: boolean;
  targetType: CommentTargetType;
  targetId: number;
  pathname: string;
  showGuestFields: boolean;
  ownerAvatarUrl?: string | null;
  user: PostCommentListProps["user"];
}) {
  const [isReplying, setIsReplying] = useState(false);
  const isNested = depth > 0;
  const replies = isNested ? [] : comment.replies;

  return (
    <article className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-zinc-200/70 py-4 first:pt-0 last:border-b-0 dark:border-zinc-800/70">
      <div className="pt-0.5">
        <CommentAvatar comment={comment} ownerAvatarUrl={ownerAvatarUrl} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {comment.author.name}
          </p>
          <CommentAuthorBadge role={comment.author.role} />
          <time className="text-xs text-zinc-400 dark:text-zinc-500" dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </time>
        </div>
        {isNested && comment.parentAuthorName ? (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            回复 {comment.parentAuthorName}
          </p>
        ) : null}
        <CommentBody body={comment.body} />

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
              targetType={targetType}
              targetId={targetId}
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
                targetType={targetType}
                targetId={targetId}
                pathname={pathname}
                showGuestFields={showGuestFields}
                ownerAvatarUrl={ownerAvatarUrl}
                user={user}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CommentBody({ body }: { body: string }) {
  return (
    <div className="mt-2 overflow-x-auto text-sm leading-7 text-zinc-600 dark:text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        allowedElements={[
          "p",
          "br",
          "strong",
          "em",
          "del",
          "code",
          "pre",
          "blockquote",
          "ul",
          "ol",
          "li",
          "a",
          "hr",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
        ]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer nofollow noopener"
              className="text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 font-mono text-[13px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-3">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-zinc-200 pl-3 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
          hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-800" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-zinc-200 px-2 py-1.5 font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-900">
              {children}
            </td>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

function countComments(comments: PublicPostComment[]) {
  return comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
}

function sortComments(
  comments: PublicPostComment[],
  sortOrder: "latest" | "earliest",
): PublicPostComment[] {
  const direction = sortOrder === "latest" ? -1 : 1;
  const compare = (left: PublicPostComment, right: PublicPostComment) =>
    (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction;

  return comments
    .map((comment) => ({
      ...comment,
      replies: [...comment.replies].sort(compare),
    }))
    .sort(compare);
}

function CommentAvatar({
  comment,
  ownerAvatarUrl,
}: {
  comment: PublicPostComment;
  ownerAvatarUrl?: string | null;
}) {
  const avatarUrl =
    comment.author.image ?? (comment.author.role === "OWNER" ? ownerAvatarUrl ?? null : null);

  if (avatarUrl) {
    return (
      <span
        className="block size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
        style={{ backgroundImage: `url(${avatarUrl})` }}
      />
    );
  }

  return (
    <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
      {comment.author.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function CommentAuthorBadge({
  role,
}: {
  role: PublicPostComment["author"]["role"];
}) {
  if (role === "OWNER") {
    return (
      <span className="inline-flex rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">
        站长
      </span>
    );
  }

  if (role === "ADMIN") {
    return (
      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
        管理员
      </span>
    );
  }

  return null;
}
