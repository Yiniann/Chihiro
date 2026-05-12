import { PublicAuthStatus } from "@/components/public-auth-status";
import { PostCommentForm } from "@/components/post-comment-form";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { auth } from "@/server/public-auth";
import { listApprovedCommentsForPost } from "@/server/repositories/comments";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

type PostCommentsProps = {
  postId: number;
  pathname: string;
};

export async function PostComments({ postId, pathname }: PostCommentsProps) {
  const settings = await getPublicInteractionSettings();

  if (!settings.commentsEnabled) {
    return null;
  }

  const [comments, session, siteSettings] = await Promise.all([
    listApprovedCommentsForPost(postId),
    auth(),
    getSiteSettings(),
  ]);
  const user = session?.user ?? null;
  const canComment = Boolean(user) || !settings.loginRequiredToComment;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  return (
    <section className="mt-10 grid gap-5 border-t-0 pt-0">
      <div>
        {canComment ? (
          <PostCommentForm
            postId={postId}
            pathname={pathname}
            showGuestFields={!user && !settings.loginRequiredToComment}
            user={user}
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-zinc-200/80 bg-transparent dark:border-zinc-800/80">
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">登录后可评论</p>
              <PublicAuthStatus siteUrl={siteUrl} user={user} variant="comment" />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-1">
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
    <article className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-zinc-200/70 py-4 first:pt-0 last:border-b-0 dark:border-zinc-800/70">
      <div className="pt-0.5">
        {comment.author.image ? (
          <span
            className="block size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
            style={{ backgroundImage: `url(${comment.author.image})` }}
          />
        ) : (
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
            {comment.author.name.slice(0, 1).toUpperCase()}
          </span>
        )}
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
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {comment.body}
        </p>
      </div>
    </article>
  );
}
