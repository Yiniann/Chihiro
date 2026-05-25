import { SubscriptionSettingsForm } from "@/app/(admin)/admin/settings/subscriptions/subscription-settings-form";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";

export default async function AdminSubscriptionSettingsPage() {
  const settings = await getPublicInteractionSettings();

  return (
    <div className="grid gap-8">
      <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem] md:px-6 md:py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            Settings
          </p>
          <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
            订阅设置
          </h1>
        </div>
        <button
          type="submit"
          form="subscription-settings-form"
          className="inline-flex h-11 shrink-0 items-center justify-center px-1 text-sm font-medium text-primary underline underline-offset-4 transition hover:opacity-80 dark:text-primary"
        >
          保存设置
        </button>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <SubscriptionSettingsForm defaultEnabled={settings.subscriptionsEnabled} />
      </div>
    </div>
  );
}
