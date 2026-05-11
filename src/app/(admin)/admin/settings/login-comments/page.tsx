import Link from "next/link";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { LoginCommentsSettingsForm } from "@/app/(admin)/admin/settings/login-comments/login-comments-settings-form";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminLoginCommentsSettingsPage() {
  const [settings, siteSettings] = await Promise.all([
    getPublicInteractionSettings(),
    getSiteSettings(),
  ]);
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <Link
          href="/admin/settings"
          className="inline-flex w-fit items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          返回设置
        </Link>
        <AdminPageHeader eyebrow="Settings" title="登录与评论" />
      </div>
      <LoginCommentsSettingsForm
        defaults={settings}
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
