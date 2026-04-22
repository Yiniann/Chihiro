import { redirect } from "next/navigation";
import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig } from "@/lib/site";
import { getInstallationState, isInstallationComplete } from "@/server/installation";
import {
  getPublicAdminState,
  listPublicHeaderPostCategories,
  listPublicRecentArchiveItems,
  listPublicRecentUpdateItems,
  getPublicSiteSettings,
  isPublicSiteUnavailableError,
} from "@/server/public-content";

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

  try {
    [postCategories, recentArchiveItems, recentUpdateItems, siteSettings, adminState] =
      await Promise.all([
        listPublicHeaderPostCategories(),
        listPublicRecentArchiveItems(),
        listPublicRecentUpdateItems(),
        getPublicSiteSettings(),
        getPublicAdminState(),
      ]);
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return (
        <div className="relative flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <div aria-hidden="true" className="site-bottom-noise" />
          <div className="relative z-10 flex-1">
            <PublicSiteUnavailableScreen />
          </div>
        </div>
      );
    }

    throw error;
  }

  const adminDisplayName = siteSettings.authorName ?? siteConfig.author;
  const adminAvatarUrl = siteSettings.authorAvatarUrl ?? siteConfig.avatar;

  return (
    <div className="relative flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div aria-hidden="true" className="site-bottom-noise" />
      <SiteHeader
        isAdminLoggedIn={adminState.isAdminLoggedIn}
        adminDisplayName={adminDisplayName}
        adminAvatarUrl={adminAvatarUrl}
        postCategories={postCategories}
        recentArchiveItems={recentArchiveItems}
        recentUpdateItems={recentUpdateItems}
      />
      <div className="relative z-10 flex-1 pt-24 sm:pt-28">{children}</div>
      <SiteFooter />
    </div>
  );
}
