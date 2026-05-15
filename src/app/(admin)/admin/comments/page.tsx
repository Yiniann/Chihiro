import { CommentStatus } from "@prisma/client";
import Link from "next/link";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import {
  approveCommentAction,
  deleteCommentAction,
  holdCommentAction,
  markCommentSpamAction,
} from "@/app/(admin)/admin/comments/actions";
import { EmptyPanel, StatCard } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import {
  getCommentStatsForAdmin,
  listCommentsForAdmin,
  type AdminCommentItem,
  type AdminCommentStatusFilter,
} from "@/server/repositories/comments";

type AdminCommentsSearchParams = Promise<{
  status?: string;
}>;

const statusFilters: Array<{
  label: string;
  value: AdminCommentStatusFilter;
}> = [
  { label: "全部", value: "all" },
  { label: "待审核", value: "pending" },
  { label: "已公开", value: "approved" },
  { label: "垃圾", value: "spam" },
];

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: AdminCommentsSearchParams;
}) {
  const { status } = await searchParams;
  const activeStatus = getCommentStatusFilter(status);
  const [comments, stats] = await Promise.all([
    listCommentsForAdmin(activeStatus),
    getCommentStatsForAdmin(),
  ]);

  return (
    <div className="grid gap-10">
      <section className="grid grid-cols-4 gap-2 sm:gap-4">
        <BoardStat>
          <StatCard label="全部评论" value={stats.total} />
        </BoardStat>
        <BoardStat>
          <StatCard label="待审核" value={stats.pending} tone="muted" />
        </BoardStat>
        <BoardStat>
          <StatCard label="已公开" value={stats.approved} tone="success" />
        </BoardStat>
        <BoardStat>
          <StatCard label="垃圾评论" value={stats.spam} tone="neutral" />
        </BoardStat>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          {statusFilters.map((item) => (
            <Link
              key={item.value}
              href={item.value === "all" ? "/admin/comments" : `/admin/comments?status=${item.value}`}
              className={[
                "inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium transition",
                item.value === activeStatus
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {comments.length > 0 ? (
          <div className="grid gap-0">
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <EmptyPanel text="当前筛选下还没有评论。" />
        )}
      </section>
    </div>
  );
}

function BoardStat({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 px-5 py-4">{children}</div>;
}

function CommentRow({ comment }: { comment: AdminCommentItem }) {
  return (
    <article className="grid gap-4 border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 dark:border-zinc-800/80 lg:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <AuthorAvatar comment={comment} />
          <p className="font-medium text-zinc-950 dark:text-zinc-50">{comment.author.name}</p>
          <CommentStatusBadge status={comment.status} />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {comment.author.source === "user" ? "登录用户" : "访客"}
          </span>
        </div>

        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          {comment.body}
        </p>

        {comment.parent ? (
          <div className="mt-3 border-l border-zinc-200/80 pl-3 text-xs leading-6 text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <span>回复 {comment.parent.authorName}：</span>
            <span className="line-clamp-2">{comment.parent.body}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {comment.author.email ? <span>{comment.author.email}</span> : null}
          {comment.author.email ? <span>·</span> : null}
          <span>{formatAdminDateTime(comment.createdAt)}</span>
          <span>·</span>
          <Link
            href={comment.post.href}
            target="_blank"
            className="border-b border-transparent text-primary transition hover:border-primary/40"
          >
            {comment.post.title}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
        {comment.status !== CommentStatus.APPROVED ? (
          <CommentActionForm action={approveCommentAction} id={comment.id} label="通过" />
        ) : null}
        {comment.status !== CommentStatus.PENDING ? (
          <CommentActionForm action={holdCommentAction} id={comment.id} label="待审" />
        ) : null}
        {comment.status !== CommentStatus.SPAM ? (
          <CommentActionForm action={markCommentSpamAction} id={comment.id} label="垃圾" />
        ) : null}
        <ConfirmActionDialog
          triggerLabel="删除"
          triggerClassName="border-b border-transparent px-0 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 dark:text-rose-400 dark:hover:border-rose-800"
          title="删除这条评论？"
          description="删除后无法撤销，这条评论会从文章下永久移除。"
          confirmLabel="删除评论"
          action={deleteCommentAction}
          fields={[{ name: "id", value: comment.id }]}
          confirmTone="danger"
        />
      </div>
    </article>
  );
}

function CommentActionForm({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      >
        {label}
      </button>
    </form>
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
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300"
      : status === CommentStatus.PENDING
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-300"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function getCommentStatusFilter(value?: string): AdminCommentStatusFilter {
  if (value === "pending" || value === "approved" || value === "spam") {
    return value;
  }

  return "all";
}
