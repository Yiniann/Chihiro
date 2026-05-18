import { UserRole } from "@prisma/client";
import { AccountLinkButton } from "@/app/(admin)/admin/settings/users/account-link-button";
import { AccountLinkToast } from "@/app/(admin)/admin/settings/users/account-link-toast";
import { OwnerSecurityForms } from "@/app/(admin)/admin/settings/users/owner-security-forms";
import { getProviderLabel } from "@/lib/account-linking";
import { unlinkOwnerProviderAction } from "@/app/(admin)/admin/settings/users/actions";
import type { UserAuthMethods, UserListItem } from "@/server/repositories/users";

export function ReaderAuthPanel({
  ownerUser,
  ownerAvatarUrl,
  authMethods,
  linkedProvider,
  githubEnabled,
  googleEnabled,
  siteUrl,
}: {
  ownerUser: UserListItem | null;
  ownerAvatarUrl: string | null;
  authMethods: UserAuthMethods;
  linkedProvider: string | null;
  githubEnabled: boolean;
  googleEnabled: boolean;
  siteUrl: string;
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
      <AccountLinkToast linkedProvider={linkedProvider} />

      <div className="grid gap-3">
      </div>

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

          <OwnerSecurityForms
            defaultEmail={ownerUser?.email ?? ""}
            hasPasswordLogin={authMethods.hasPasswordLogin}
          />
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">绑定方式</p>
          <div className="grid gap-3">
            <ProviderLinkRow
              provider="github"
              enabled={githubEnabled}
              linked={authMethods.providers.includes("github")}
              siteUrl={siteUrl}
            />
            <ProviderLinkRow
              provider="google"
              enabled={googleEnabled}
              linked={authMethods.providers.includes("google")}
              siteUrl={siteUrl}
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
  siteUrl,
}: {
  provider: "github" | "google";
  enabled: boolean;
  linked: boolean;
  siteUrl: string;
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
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            已绑定
          </span>
          <form action={unlinkOwnerProviderAction}>
            <input type="hidden" name="provider" value={provider} />
            <button
              type="submit"
              className="text-sm font-medium text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              解除绑定
            </button>
          </form>
        </div>
      ) : enabled ? (
        <AccountLinkButton provider={provider} label={label} siteUrl={siteUrl} />
      ) : (
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          未启用
        </span>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const className =
    role === UserRole.OWNER
      ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
      : role === UserRole.ADMIN
        ? "bg-primary/10 text-primary"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.66rem] font-medium uppercase tracking-[0.14em] ${className}`}>
      {role}
    </span>
  );
}
