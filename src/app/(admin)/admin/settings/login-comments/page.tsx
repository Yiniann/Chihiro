import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { LoginCommentsSettingsForm } from "@/app/(admin)/admin/settings/login-comments/login-comments-settings-form";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { isOwnerAuthenticated } from "@/server/auth";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminLoginCommentsSettingsPage() {
  const [settings, siteSettings, canEdit] = await Promise.all([
    getPublicInteractionSettings(),
    getSiteSettings(),
    isOwnerAuthenticated(),
  ]);
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <AdminPageHeader eyebrow="Settings" title="登录与评论" />
      </div>
      <LoginCommentsSettingsForm
        defaults={settings}
        canEdit={canEdit}
        authStatus={{
          authSecret: Boolean(process.env.AUTH_SECRET?.trim()),
          githubId: Boolean(process.env.AUTH_GITHUB_ID?.trim()),
          githubSecret: Boolean(process.env.AUTH_GITHUB_SECRET?.trim()),
          callbackUrl: `${siteUrl}/api/auth/callback/github`,
        }}
      />
    </div>
  );
}
