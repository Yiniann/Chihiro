import { WebsocketSettingsForm } from "@/app/(admin)/admin/settings/websocket/websocket-settings-form";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminWebsocketSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="grid gap-8">
      <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem] md:px-6 md:py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            Settings
          </p>
          <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
            WebSocket 设置
          </h1>
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <WebsocketSettingsForm
          defaultSiteLiveVisitorsEnabled={settings?.siteLiveVisitorsEnabled ?? true}
          defaultPostReadingPresenceEnabled={settings?.postReadingPresenceEnabled ?? true}
          defaultStandalonePageReadingPresenceEnabled={
            settings?.standalonePageReadingPresenceEnabled ?? true
          }
        />
      </div>
    </div>
  );
}
