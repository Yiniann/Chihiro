import { PublicAuthStatus } from "@/components/public-auth-status";
import { PostCommentList } from "@/components/post-comment-list";
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

      <PostCommentList
        comments={comments}
        canComment={canComment}
        postId={postId}
        pathname={pathname}
        showGuestFields={!user && !settings.loginRequiredToComment}
        user={user}
      />
    </section>
  );
}
