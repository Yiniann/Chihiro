import { AccountLinkToast } from "@/app/(admin)/admin/settings/users/account-link-toast";
import { OwnerSecurityForms } from "@/app/(admin)/admin/settings/users/owner-security-forms";
import type { SocialLink } from "@/lib/social-links";
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
      : null;
  const defaultSocialLinks = buildDefaultSocialLinks(
    ownerUser?.socialLinks ?? [],
    ownerUser?.email ?? null,
    ownerUser?.githubUrl ?? null,
  );

  return (
    <section className="grid gap-5 border-b border-zinc-200/80 pb-8 dark:border-zinc-800/80">
      <AccountLinkToast linkedProvider={linkedProvider} />

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
            <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{displayName}</p>
            {secondaryText ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{secondaryText}</p>
            ) : null}
          </div>
        </div>

        <OwnerSecurityForms
          defaultUsername={ownerUser?.username ?? authMethods.username ?? ""}
          defaultName={ownerUser?.name ?? ""}
          defaultImage={ownerUser?.image ?? ""}
          defaultSocialLinks={defaultSocialLinks}
          githubEnabled={githubEnabled}
          googleEnabled={googleEnabled}
          linkedGithub={authMethods.providers.includes("github")}
          linkedGoogle={authMethods.providers.includes("google")}
          siteUrl={siteUrl}
        />
      </div>
    </section>
  );
}

function buildDefaultSocialLinks(
  socialLinks: SocialLink[],
  email: string | null,
  githubUrl: string | null,
) {
  const links = [...socialLinks];

  if (email && !links.some((link) => link.platform === "email")) {
    links.unshift({
      platform: "email",
      label: "Email",
      href: email,
    });
  }

  if (githubUrl && !links.some((link) => link.platform === "github")) {
    const emailIndex = links.findIndex((link) => link.platform === "email");
    const insertIndex = emailIndex >= 0 ? emailIndex + 1 : 0;

    links.splice(insertIndex, 0, {
      platform: "github",
      label: "GitHub",
      href: githubUrl,
    });
  }

  return links;
}
