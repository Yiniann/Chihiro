import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AdminPageHeader, EmptyPanel } from "@/app/(admin)/admin/ui";
import { ClearLinkIntent } from "@/app/(site)/auth/error/clear-link-intent";
import { getProviderLabel } from "@/lib/account-linking";
import { setUserRoleAction } from "@/app/(admin)/admin/settings/users/actions";
import { auth } from "@/server/public-auth";
import { isOwnerAuthenticated } from "@/server/auth";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";
import {
  getUserAuthMethods,
  listUsersForAdmin,
  type UserAuthMethods,
  type UserListItem,
} from "@/server/repositories/users";

type AdminUsersSettingsPageProps = {
  searchParams?: Promise<{
    linked?: string;
  }>;
};

export default async function AdminUsersSettingsPage({ searchParams }: AdminUsersSettingsPageProps) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const [params, users, canManageRoles, authMethods, interactionSettings, siteSettings] = await Promise.all([
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
  const ownerUser = users.find((user) => user.id === currentUserId) ?? users.find((user) => user.role === UserRole.OWNER) ?? null;
  const managedUsers = users.filter((user) => user.role !== UserRole.OWNER);
  const ownerAvatarUrl = ownerUser?.image ?? siteSettings?.authorAvatarUrl ?? null;

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <Link
          href="/admin/settings"
          className="inline-flex w-fit items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          返回设置
        </Link>
        <AdminPageHeader eyebrow="Settings" title="用户与权限" />
        {!canManageRoles ? (
          <p className="max-w-2xl text-sm leading-7 text-zinc-400 dark:text-zinc-500">
            当前帐号不是 Owner，以下按钮仅展示为禁用态。
          </p>
        ) : null}
      </div>

      {canManageRoles && authMethods ? (
        <OwnerAccountBindingPanel
          ownerUser={ownerUser}
          ownerAvatarUrl={ownerAvatarUrl}
          authMethods={authMethods}
          linkedProvider={linkedProvider}
          githubEnabled={githubEnabled}
          googleEnabled={googleEnabled}
        />
      ) : null}

      {managedUsers.length > 0 ? (
        <section className="grid gap-0">
          {managedUsers.map((user) => (
            <UserRow key={user.id} user={user} canManageRoles={canManageRoles} />
          ))}
        </section>
      ) : (
        <EmptyPanel text="还没有公开登录用户。先用右上角登录一次，再回到这里设置管理员权限。" />
      )}
    </div>
  );
}

function OwnerAccountBindingPanel({
  ownerUser,
  ownerAvatarUrl,
  authMethods,
  linkedProvider,
  githubEnabled,
  googleEnabled,
}: {
  ownerUser: UserListItem | null;
  ownerAvatarUrl: string | null;
  authMethods: UserAuthMethods;
  linkedProvider: string | null;
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const displayName =
    ownerUser?.name ?? ownerUser?.email ?? authMethods.username ?? "Owner";
  const secondaryText =
    ownerUser?.email && ownerUser.email !== displayName
      ? ownerUser.email
      : authMethods.hasPasswordLogin
        ? "本地帐号"
        : null;

  return (
    <section className="grid gap-5 border-b border-zinc-200/80 pb-8 dark:border-zinc-800/80">
      <ClearLinkIntent />
      {linkedProvider ? (
        <div className="rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {getProviderLabel(linkedProvider)} 已绑定到当前 Owner 帐号。
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {ownerAvatarUrl ? (
              <span
                className="size-11 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
                style={{ backgroundImage: `url(${ownerAvatarUrl})` }}
              />
            ) : (
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{displayName}</p>
                <RoleBadge role={UserRole.OWNER} />
              </div>
              {secondaryText ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{secondaryText}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">绑定方式</p>
          <div className="grid gap-3">
            <ProviderLinkRow
              provider="github"
              enabled={githubEnabled}
              linked={authMethods.providers.includes("github")}
            />
            <ProviderLinkRow
              provider="google"
              enabled={googleEnabled}
              linked={authMethods.providers.includes("google")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProviderLinkRow({
  provider,
  enabled,
  linked,
}: {
  provider: "github" | "google";
  enabled: boolean;
  linked: boolean;
}) {
  const label = getProviderLabel(provider);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{label}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {linked ? "已经绑定到当前 Owner 帐号" : enabled ? "可绑定到当前 Owner 帐号" : "当前未配置"}
        </p>
      </div>
      {linked ? (
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          已绑定
        </span>
      ) : enabled ? (
        <Link
          href={`/auth/link/${provider}?next=${encodeURIComponent("/admin/settings/users")}`}
          className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          绑定 {label}
        </Link>
      ) : (
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          未启用
        </span>
      )}
    </div>
  );
}

function UserRow({ user, canManageRoles }: { user: UserListItem; canManageRoles: boolean }) {
  const displayName = user.name ?? user.email ?? "未命名用户";

  return (
    <article className="grid gap-4 border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 dark:border-zinc-800/80 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {user.image ? (
            <span
              className="size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
              style={{ backgroundImage: `url(${user.image})` }}
            />
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{displayName}</p>
              <RoleBadge role={user.role} />
            </div>
            {user.email ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            ) : null}
          </div>
        </div>

        {user.accounts.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {user.accounts.map((account) => (
              <span
                key={`${account.provider}:${account.providerAccountId}`}
                className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900"
              >
                {account.provider} · {account.providerAccountId}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 md:justify-end">
        {user.role === UserRole.OWNER ? (
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Owner 受保护</span>
        ) : user.role === UserRole.ADMIN ? (
          <RoleForm
            userId={user.id}
            role={UserRole.USER}
            label="设为普通用户"
            disabled={!canManageRoles}
          />
        ) : (
          <RoleForm
            userId={user.id}
            role={UserRole.ADMIN}
            label="设为管理员"
            disabled={!canManageRoles}
          />
        )}
      </div>
    </article>
  );
}

function RoleForm({
  userId,
  role,
  label,
  disabled,
}: {
  userId: string;
  role: UserRole;
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={setUserRoleAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={disabled}
        className="border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      >
        {label}
      </button>
    </form>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const isOwner = role === UserRole.OWNER;
  const isAdmin = role === UserRole.ADMIN;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isOwner
          ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
          : isAdmin
          ? "bg-primary/10 text-primary"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      {isOwner ? "Owner" : isAdmin ? "管理员" : "用户"}
    </span>
  );
}
