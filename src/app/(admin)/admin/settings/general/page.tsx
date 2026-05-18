import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { GeneralSettingsForm } from "@/app/(admin)/admin/settings/general/general-settings-form";
import { isOwnerAuthenticated } from "@/server/auth";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminGeneralSettingsPage() {
  const [siteSettings, canEdit] = await Promise.all([getSiteSettings(), isOwnerAuthenticated()]);
  const defaults = {
    siteName: siteSettings?.siteName ?? siteConfig.name,
    authorName: siteSettings?.authorName ?? siteConfig.author,
    authorAvatarUrl: siteSettings?.authorAvatarUrl ?? siteConfig.avatar,
    siteUrl: resolveCanonicalSiteUrl(siteSettings),
    email: siteSettings?.email ?? siteConfig.email,
    githubUrl: siteSettings?.githubUrl ?? siteConfig.github,
    heroIntro: siteSettings?.heroIntro ?? siteConfig.heroIntro,
    summary: siteSettings?.summary ?? siteConfig.summary,
    motto: siteSettings?.motto ?? siteConfig.motto,
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <AdminPageHeader eyebrow="Settings" title="常规设置" />
      </div>
      <GeneralSettingsForm defaults={defaults} canEdit={canEdit} />
    </div>
  );
}
