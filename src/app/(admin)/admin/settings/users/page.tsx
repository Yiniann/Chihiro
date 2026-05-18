import { UserRole } from "@prisma/client";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { ReaderAuthPanel } from "@/app/(admin)/admin/settings/readers/reader-auth-panel";
import { isOwnerAuthenticated } from "@/server/auth";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
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
  const ownerAvatarUrl = ownerUser?.image ?? siteConfig.avatar;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-8">
      <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem] md:px-6 md:py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            Settings
          </p>
          <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
            用户设置
          </h1>
        </div>
        {canManageUsers ? (
          <button
            type="submit"
            form="owner-settings-form"
            className="inline-flex h-11 shrink-0 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
          >
            保存设置
          </button>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-2xl">
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
    </div>
  );
}
