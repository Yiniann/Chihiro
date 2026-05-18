import { UserRole } from "@prisma/client";
import { AdminPageHeader, EmptyPanel } from "@/app/(admin)/admin/ui";
import { ReaderAuthPanel } from "@/app/(admin)/admin/settings/readers/reader-auth-panel";
import { isOwnerAuthenticated } from "@/server/auth";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { auth } from "@/server/public-auth";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";
import { getUserAuthMethods, listUsersForAdmin } from "@/server/repositories/users";

type AdminUsersSettingsPageProps = {
  searchParams?: Promise<{
    linked?: string;
  }>;
};

export default async function AdminUsersSettingsPage({
  searchParams,
}: AdminUsersSettingsPageProps) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const [params, users, canManageUsers, authMethods, interactionSettings, siteSettings] =
    await Promise.all([
      searchParams ? searchParams : Promise.resolve<{ linked?: string }>({}),
      listUsersForAdmin(),
      isOwnerAuthenticated(),
      currentUserId ? getUserAuthMethods(currentUserId) : Promise.resolve(null),
      getPublicInteractionSettings(),
      getSiteSettings(),
    ]);
  const linkedProvider = typeof params.linked === "string" ? params.linked : null;
  const githubEnabled =
    interactionSettings.githubLoginEnabled &&
    (Boolean(interactionSettings.githubClientId) || Boolean(process.env.AUTH_GITHUB_ID?.trim())) &&
    (interactionSettings.hasGithubClientSecret || Boolean(process.env.AUTH_GITHUB_SECRET?.trim()));
  const googleEnabled = interactionSettings.googleLoginEnabled;
  const ownerUser =
    users.find((user) => user.id === currentUserId) ??
    users.find((user) => user.role === UserRole.OWNER) ??
    null;
  const ownerAvatarUrl = ownerUser?.image ?? siteSettings?.authorAvatarUrl ?? null;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <AdminPageHeader eyebrow="Settings" title="用户" />
      </div>

      {canManageUsers && authMethods ? (
        <ReaderAuthPanel
          ownerUser={ownerUser}
          ownerAvatarUrl={ownerAvatarUrl}
          authMethods={authMethods}
          linkedProvider={linkedProvider}
          githubEnabled={githubEnabled}
          googleEnabled={googleEnabled}
          siteUrl={siteUrl}
        />
      ) : (
        <EmptyPanel text="只有 Owner 可以管理用户登录方式与第三方绑定。" />
      )}

      {!canManageUsers ? (
        <div className="grid gap-3">
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 dark:text-zinc-500">
            当前帐号不是 Owner，上面的登录方式面板不会开放编辑。
          </p>
        </div>
      ) : null}
    </div>
  );
}
