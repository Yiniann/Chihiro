import { AccountLinkToast } from "@/app/(admin)/admin/settings/users/account-link-toast";
import { OwnerSecurityForms } from "@/app/(admin)/admin/settings/users/owner-security-forms";
import { AtSign, Mail } from "lucide-react";
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
  const username = ownerUser?.username ?? authMethods.username ?? null;
  const email = ownerUser?.email ?? null;
  const defaultSocialLinks = buildDefaultSocialLinks(
    ownerUser?.socialLinks ?? [],
    email,
    ownerUser?.githubUrl ?? null,
  );

  return (
    <section className="grid gap-5 border-b border-zinc-200/80 pb-8 dark:border-zinc-800/80">
      <AccountLinkToast linkedProvider={linkedProvider} />

      <div className="min-w-0">
        <div className="flex items-center gap-4">
          {ownerAvatarUrl ? (
            <span
              className="size-20 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
              style={{ backgroundImage: `url(${ownerAvatarUrl})` }}
            />
          ) : (
            <span className="inline-flex size-20 items-center justify-center rounded-full bg-zinc-950 text-xl font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {displayName}
            </p>
            {username ? (
              <p className="flex items-center gap-1.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                <AtSign className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                <span className="truncate">{username}</span>
              </p>
            ) : null}
            {email ? (
              <p className="flex items-center gap-1.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                <span className="truncate">{email}</span>
              </p>
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
