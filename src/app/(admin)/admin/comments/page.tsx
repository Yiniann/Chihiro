import { CommentStatus } from "@prisma/client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CommentActionMenu } from "@/app/(admin)/admin/comments/comment-action-menu";
import { LiveSearchInput } from "@/app/(admin)/admin/live-search-input";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import {
  getCommentStatsForAdmin,
  listCommentsForAdmin,
  type AdminCommentItem,
  type AdminCommentStatusFilter,
} from "@/server/repositories/comments";

type AdminCommentsSearchParams = Promise<{
  status?: string;
  q?: string;
}>;

const groupedStatusFilters: Array<{
  label: string;
  value: Exclude<AdminCommentStatusFilter, "pending" | "all">;
}> = [
  { label: "已公开", value: "approved" },
  { label: "垃圾", value: "spam" },
];

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: AdminCommentsSearchParams;
}) {
  const { status, q } = await searchParams;
  const activeStatus = getGroupedCommentStatusFilter(status);
  const query = q?.trim() ?? "";
  const [pendingComments, groupedComments, stats] = await Promise.all([
    listCommentsForAdmin("pending"),
    listCommentsForAdmin(activeStatus),
    getCommentStatsForAdmin(),
  ]);
  const filteredPendingComments = filterComments(pendingComments, query);
  const filteredGroupedComments = filterComments(groupedComments, query);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">评论管理</p>
          </div>

          <LiveSearchInput
            defaultValue={query}
            placeholder="搜索评论、作者、邮箱或内容"
          />
        </div>
      </section>

      <CommentSection
        title="待审核评论"
        comments={filteredPendingComments}
        emptyText={query ? "没有找到匹配的待审核评论。" : "当前没有待审核评论。"}
      />

      <CommentSection
        title="已处理评论"
        comments={filteredGroupedComments}
        emptyText={query ? "没有找到匹配的评论。" : "当前筛选下还没有评论。"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {groupedStatusFilters.map((item) => (
              <Link
                key={item.value}
                href={getCommentsFilterHref(item.value, query)}
                className={[
                  "inline-flex h-9 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition",
                  item.value === activeStatus
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {item.label}
                <span
                  className={[
                    "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.68rem]",
                    item.value === activeStatus
                      ? "bg-white/80 text-primary dark:bg-white/10"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {getGroupedFilterCount(item.value, stats)}
                </span>
              </Link>
            ))}
          </div>
        }
      />
    </div>
  );
}

function CommentSection({
  title,
  comments,
  emptyText,
  actions,
}: {
  title: string;
  comments: AdminCommentItem[];
  emptyText: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {comments.length > 0 ? (
        <div className="grid gap-0">
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <EmptyPanel text={emptyText} />
      )}
    </section>
  );
}

function CommentRow({ comment }: { comment: AdminCommentItem }) {
  const isPending = comment.status === CommentStatus.PENDING;
  const summaryMeta = [
    comment.author.source === "user" ? "登录用户" : "访客",
    comment.author.email,
    formatAdminDateTime(comment.createdAt),
  ].filter(Boolean);

  return (
    <article
      className={[
        "grid gap-4 border-b py-5 first:pt-0 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]",
        isPending
          ? "border-amber-200/80 dark:border-amber-400/20"
          : "border-zinc-200/80 dark:border-zinc-800/80",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <AuthorAvatar comment={comment} />
          <p className="font-medium text-zinc-950 dark:text-zinc-50">{comment.author.name}</p>
          <CommentStatusBadge status={comment.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {summaryMeta.map((item, index) => (
            <span key={`${comment.id}-meta-${index}`}>{item}</span>
          ))}
        </div>

        {comment.parent ? (
          <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            回复 <span className="font-medium text-zinc-700 dark:text-zinc-300">{comment.parent.authorName}</span>
          </p>
        ) : null}

        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          {comment.body}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={comment.target.href}
            target="_blank"
            className="inline-flex items-center gap-2 border-b border-transparent py-1 text-sm text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <span className="max-w-[22rem] truncate">
              {comment.target.type === "post" ? "文章" : "页面"} · {comment.target.title}
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex min-w-[14rem] justify-start lg:justify-end">
        <CommentActionMenu commentId={comment.id} status={comment.status} />
      </div>
    </article>
  );
}

function AuthorAvatar({ comment }: { comment: AdminCommentItem }) {
  if (comment.author.image) {
    return (
      <span
        className="size-7 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
        style={{ backgroundImage: `url(${comment.author.image})` }}
      />
    );
  }

  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/10">
      {comment.author.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function CommentStatusBadge({ status }: { status: CommentStatus }) {
  const label =
    status === CommentStatus.APPROVED ? "已公开" : status === CommentStatus.PENDING ? "待审核" : "垃圾";
  const className =
    status === CommentStatus.APPROVED
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300 dark:ring-emerald-400/10"
      : status === CommentStatus.PENDING
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/25 dark:text-amber-300 dark:ring-amber-400/10"
        : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:ring-zinc-800";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function getGroupedFilterCount(
  filter: Exclude<AdminCommentStatusFilter, "pending" | "all">,
  stats: Awaited<ReturnType<typeof getCommentStatsForAdmin>>,
) {
  if (filter === "approved") {
    return stats.approved;
  }

  return stats.spam;
}

function getCommentsFilterHref(
  filter: Exclude<AdminCommentStatusFilter, "pending" | "all">,
  query: string,
) {
  const params = new URLSearchParams();
  params.set("status", filter);

  if (query) {
    params.set("q", query);
  }

  const nextQuery = params.toString();
  return nextQuery ? `/admin/comments?${nextQuery}` : "/admin/comments";
}

function filterComments(comments: AdminCommentItem[], query: string) {
  if (!query) {
    return comments;
  }

  const normalizedQuery = query.toLocaleLowerCase("zh-CN");

  return comments.filter((comment) => {
    const haystack = [
      comment.body,
      comment.author.name,
      comment.author.email ?? "",
      comment.target.title,
      comment.parent?.authorName ?? "",
      comment.parent?.body ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");

    return haystack.includes(normalizedQuery);
  });
}

function getGroupedCommentStatusFilter(
  value?: string,
): Exclude<AdminCommentStatusFilter, "pending" | "all"> {
  if (value === "approved" || value === "spam") {
    return value;
  }

  return "approved";
}
