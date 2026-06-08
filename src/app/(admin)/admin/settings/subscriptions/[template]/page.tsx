import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateSettingsForm } from "@/app/(admin)/admin/settings/subscriptions/template-settings-form";
import {
  getSubscriptionTemplateDefaults,
  isSubscriptionTemplateKey,
  subscriptionTemplateConfigs,
} from "@/app/(admin)/admin/settings/subscriptions/template-config";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminSubscriptionTemplatePage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;

  if (!isSubscriptionTemplateKey(template)) {
    notFound();
  }

  const [settings, siteSettings] = await Promise.all([
    getPublicInteractionSettings(),
    getSiteSettings(),
  ]);
  const config = subscriptionTemplateConfigs[template];
  const previewOwnerLabel =
    siteSettings?.authorName?.trim() || siteSettings?.siteName?.trim() || "Chihiro";
  const previewFooterLabel = `© ${new Date().getFullYear()} ${previewOwnerLabel}`;

  return (
    <div className="grid gap-8">
      <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem] md:px-6 md:py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            Settings
          </p>
          <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
            {config.label}
          </h1>
        </div>
        <button
          type="submit"
          form="subscription-template-form"
          className="inline-flex h-11 shrink-0 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
        >
          保存设置
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-2xl gap-5">
        <Link
          href="/admin/settings/subscriptions"
          className="inline-flex w-fit items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          返回订阅设置
        </Link>

        <TemplateSettingsForm
          template={template}
          defaults={getSubscriptionTemplateDefaults(settings, template)}
          previewFooterLabel={previewFooterLabel}
          previewAvatarUrl={siteSettings?.authorAvatarUrl ?? null}
        />
      </div>
    </div>
  );
}
