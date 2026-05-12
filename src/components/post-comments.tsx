import { PublicAuthStatus } from "@/components/public-auth-status";
import { PostCommentForm } from "@/components/post-comment-form";
import { auth } from "@/server/public-auth";
import { listApprovedCommentsForPost } from "@/server/repositories/comments";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";

type PostCommentsProps = {
  postId: number;
  pathname: string;
};

export async function PostComments({ postId, pathname }: PostCommentsProps) {
  const settings = await getPublicInteractionSettings();

  if (!settings.commentsEnabled) {
    return null;
  }

  const [comments, session] = await Promise.all([
    listApprovedCommentsForPost(postId),
    auth(),
  ]);
  const user = session?.user ?? null;
  const canComment = Boolean(user) || !settings.loginRequiredToComment;

  return (
    <section className="mt-12 grid gap-6 border-t border-zinc-200/80 pt-8 dark:border-zinc-800/80">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Comments
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            评论
          </h2>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {comments.length} 条
        </span>
      </div>

      <div className="border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
        {canComment ? (
          <PostCommentForm
            postId={postId}
            pathname={pathname}
            showGuestFields={!user && !settings.loginRequiredToComment}
          />
        ) : (
          <div className="grid gap-3">
            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              使用 GitHub 登录后可以评论。
            </p>
            <PublicAuthStatus user={user} />
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {comments.length > 0 ? (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        ) : (
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            还没有公开评论。
          </p>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
}: {
  comment: Awaited<ReturnType<typeof listApprovedCommentsForPost>>[number];
}) {
  return (
    <article className="grid gap-2 border-b border-zinc-200/70 pb-4 last:border-b-0 dark:border-zinc-800/70">
      <div className="flex items-center gap-3">
        {comment.author.image ? (
          <span
            className="size-8 rounded-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${comment.author.image})` }}
          />
        ) : (
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {comment.author.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {comment.author.name}
          </p>
          <time className="text-xs text-zinc-400 dark:text-zinc-500" dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </time>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
        {comment.body}
      </p>
    </article>
  );
}
