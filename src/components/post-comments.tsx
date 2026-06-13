import { PublicAuthStatus } from "@/components/public-auth-status";
import { PostCommentList } from "@/components/post-comment-list";
import { PostCommentForm } from "@/components/post-comment-form";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { auth } from "@/server/public-auth";
import { listApprovedCommentsForTarget, type CommentTargetType } from "@/server/repositories/comments";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getOwnerDisplayProfile } from "@/server/repositories/users";
import { getSiteSettings } from "@/server/repositories/site";

type PostCommentsProps = {
  targetType: CommentTargetType;
  targetId: number;
  pathname: string;
  commentsEnabled: boolean;
};

export async function PostComments({ targetType, targetId, pathname, commentsEnabled }: PostCommentsProps) {
  const settings = await getPublicInteractionSettings();

  if (!settings.commentsEnabled || !commentsEnabled) {
    return null;
  }

  const [comments, session, siteSettings, ownerProfile] = await Promise.all([
    listApprovedCommentsForTarget({ type: targetType, id: targetId }),
    auth(),
    getSiteSettings(),
    getOwnerDisplayProfile(),
  ]);
  const user = session?.user ?? null;
  const canComment = Boolean(user) || !settings.loginRequiredToComment;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const ownerAvatarUrl = ownerProfile?.image ?? siteConfig.avatar;
  const githubAuthAvailable =
    settings.githubLoginEnabled &&
    (Boolean(settings.githubClientId) || Boolean(process.env.AUTH_GITHUB_ID?.trim())) &&
    (settings.hasGithubClientSecret || Boolean(process.env.AUTH_GITHUB_SECRET?.trim()));

  return (
    <section id="post-comments" className="mt-10 grid gap-5 border-t-0 pt-0">
      <div>
        {canComment ? (
          <PostCommentForm
            targetType={targetType}
            targetId={targetId}
            pathname={pathname}
            formId="post-comment-form"
            showGuestFields={!user && !settings.loginRequiredToComment}
            user={user}
          />
        ) : (
          <div
            id="post-comment-form"
            className="overflow-hidden rounded-md border border-n-2 bg-transparent dark:border-n-2"
          >
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
              <p className="text-sm text-n-5">登录后可评论</p>
              <PublicAuthStatus
                siteUrl={siteUrl}
                githubEnabled={githubAuthAvailable}
                googleEnabled={settings.googleLoginEnabled}
                user={user}
                variant="comment"
              />
            </div>
          </div>
        )}
      </div>

      <PostCommentList
        comments={comments}
        canComment={canComment}
        targetType={targetType}
        targetId={targetId}
        pathname={pathname}
        showGuestFields={!user && !settings.loginRequiredToComment}
        user={user}
        ownerAvatarUrl={ownerAvatarUrl}
      />
    </section>
  );
}
