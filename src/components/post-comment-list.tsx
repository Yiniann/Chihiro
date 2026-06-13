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
      <p className="site-body text-n-5">
        还没有公开评论。
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="site-meta font-medium text-n-6">
          共 {totalComments} 条评论
        </p>
        <div className="site-meta flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSortOrder("latest")}
            className={`border-b border-transparent px-0 py-1 transition ${
              sortOrder === "latest"
                ? "text-n-6"
                : "text-n-4 hover:border-n-3 hover:text-n-6 dark:text-n-5 dark:hover:border-n-3 dark:hover:text-n-5"
            }`}
          >
            最新
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("earliest")}
            className={`border-b border-transparent px-0 py-1 transition ${
              sortOrder === "earliest"
                ? "text-n-6"
                : "text-n-4 hover:border-n-3 hover:text-n-6 dark:text-n-5 dark:hover:border-n-3 dark:hover:text-n-5"
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
    <article className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-n-2 py-4 first:pt-0 last:border-b-0 dark:border-n-2">
      <div className="pt-0.5">
        <CommentAvatar comment={comment} ownerAvatarUrl={ownerAvatarUrl} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="truncate text-sm font-medium text-n-6">
            {comment.author.name}
          </p>
          <CommentAuthorBadge role={comment.author.role} />
          <time className="text-xs text-n-4" dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </time>
        </div>
        {isNested && comment.parentAuthorName ? (
          <p className="mt-1 text-xs text-n-4">
            回复 {comment.parentAuthorName}
          </p>
        ) : null}
        <CommentBody body={comment.body} />

        {canComment ? (
          <button
            type="button"
            onClick={() => setIsReplying((current) => !current)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-n-4 transition hover:text-primary dark:text-n-5 dark:hover:text-primary"
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
          <div className="mt-4 grid gap-0 border-l border-n-2 pl-4 dark:border-n-2">
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
    <div className="site-body mt-2 overflow-x-auto text-n-5">
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
                <code className="block overflow-x-auto rounded-md bg-n-1 px-3 py-2 font-mono text-[13px] text-n-6 dark:bg-n-1 dark:text-n-6">
                  {children}
                </code>
              );
            }

            return (
              <code className="inline-code">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-3">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="quote my-3">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
          hr: () => <hr className="my-4 border-n-2" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-n-2 px-2 py-1.5 font-medium text-n-6 dark:border-n-2 dark:text-n-6">
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
        className="block size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-n-2 dark:ring-n-2"
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
      <span className="badge badge-accent">
        站长
      </span>
    );
  }

  if (role === "ADMIN") {
    return (
      <span className="badge badge-accent">
        管理员
      </span>
    );
  }

  return null;
}
