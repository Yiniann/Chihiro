import { redirect } from "next/navigation";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { SiteCanvasBackground } from "@/components/site-canvas-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { getInstallationState, isInstallationComplete } from "@/server/installation";
import { auth } from "@/server/public-auth";
import {
  getPublicAdminState,
  listPublicHeaderPostCategories,
  listPublicRecentArchiveItems,
  listPublicRecentUpdateItems,
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
} from "@/server/public-content";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const installationState = await getInstallationState();

  if (!isInstallationComplete(installationState)) {
    redirect("/install");
  }

  let postCategories;
  let recentArchiveItems;
  let recentUpdateItems;
  let siteSettings;
  let adminState;
  let publicSession;
  let interactionSettings;
  let ownerProfile;

  try {
    [
      postCategories,
      recentArchiveItems,
      recentUpdateItems,
      siteSettings,
      adminState,
      publicSession,
      interactionSettings,
      ownerProfile,
    ] =
      await Promise.all([
        listPublicHeaderPostCategories(),
        listPublicRecentArchiveItems(),
        listPublicRecentUpdateItems(),
        getPublicSiteSettings(),
        getPublicAdminState(),
        auth(),
        getPublicInteractionSettings(),
        getOwnerDisplayProfile(),
      ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return (
        <div className="relative flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <SiteCanvasBackground />
          <div className="relative z-10 flex-1">
            <PublicSiteUnavailableScreen />
          </div>
        </div>
      );
    }

    throw error;
  }

  const ownerDisplayName = getOwnerDisplayName(ownerProfile, siteConfig.author);
  const adminDisplayName = ownerDisplayName;
  const adminAvatarUrl = ownerProfile?.image ?? siteConfig.avatar;
  const siteName = siteSettings.siteName ?? siteConfig.name;
  const siteAuthorName = ownerDisplayName;
  const siteMotto = siteSettings.motto ?? siteConfig.motto;
  const siteEmail = ownerProfile?.email ?? null;
  const siteGithubUrl = ownerProfile?.githubUrl ?? null;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const githubAuthAvailable =
    interactionSettings.githubLoginEnabled &&
    (Boolean(interactionSettings.githubClientId) || Boolean(process.env.AUTH_GITHUB_ID?.trim())) &&
    (interactionSettings.hasGithubClientSecret || Boolean(process.env.AUTH_GITHUB_SECRET?.trim()));

  return (
    <div className="relative flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteCanvasBackground />
      <SiteHeader
        siteName={siteName}
        isAdminLoggedIn={adminState.isAdminLoggedIn}
        adminDisplayName={adminDisplayName}
        adminAvatarUrl={adminAvatarUrl}
        publicUser={publicSession?.user ?? null}
        siteUrl={siteUrl}
        publicAuthProviders={{
          github: githubAuthAvailable,
          google: interactionSettings.googleLoginEnabled,
        }}
        postCategories={postCategories}
        recentArchiveItems={recentArchiveItems}
        recentUpdateItems={recentUpdateItems}
      />
      <div className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</div>
      <SiteFooter
        siteName={siteName}
        authorName={siteAuthorName}
        motto={siteMotto}
        email={siteEmail}
        githubUrl={siteGithubUrl}
      />
    </div>
  );
}
