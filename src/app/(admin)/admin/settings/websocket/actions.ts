"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { getSiteSettings, upsertSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export type SaveWebsocketSettingsState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveWebsocketSettingsAction(
  _previousState: SaveWebsocketSettingsState,
  formData: FormData,
): Promise<SaveWebsocketSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const currentSettings = await getSiteSettings();
    const siteLiveVisitorsEnabled = getBooleanField(
      formData,
      "siteLiveVisitorsEnabled",
      currentSettings?.siteLiveVisitorsEnabled ?? true,
    );
    const postReadingPresenceEnabled = getBooleanField(
      formData,
      "postReadingPresenceEnabled",
      currentSettings?.postReadingPresenceEnabled ?? true,
    );
    const standalonePageReadingPresenceEnabled = getBooleanField(
      formData,
      "standalonePageReadingPresenceEnabled",
      currentSettings?.standalonePageReadingPresenceEnabled ?? true,
    );

    await upsertSiteSettings({
      siteName: currentSettings?.siteName ?? siteConfig.name,
      siteDescription: currentSettings?.siteDescription ?? siteConfig.description,
      siteUrl: currentSettings?.siteUrl ?? siteConfig.url,
      locale: currentSettings?.locale ?? siteConfig.locale,
      authorName: currentSettings?.authorName ?? siteConfig.author,
      authorAvatarUrl: currentSettings?.authorAvatarUrl ?? null,
      siteSubtitle: currentSettings?.siteSubtitle ?? siteConfig.subtitle,
      heroIntro: currentSettings?.heroIntro ?? siteConfig.heroIntro,
      summary: currentSettings?.summary ?? siteConfig.summary,
      motto: currentSettings?.motto ?? siteConfig.motto,
      email: currentSettings?.email ?? null,
      githubUrl: currentSettings?.githubUrl ?? null,
      projectsGitHubUsername: currentSettings?.projectsGitHubUsername ?? null,
      hiddenProjectSlugs: currentSettings?.hiddenProjectSlugs ?? [],
      siteLiveVisitorsEnabled,
      postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存 WebSocket 设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/posts/[...slug]", "page");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/websocket");

  return {
    error: null,
    success: "WebSocket 设置已更新。",
    nonce: Date.now(),
  };
}

function getBooleanField(formData: FormData, key: string, fallback: boolean) {
  if (!formData.has(key)) {
    return fallback;
  }

  const value = formData.get(key);
  return value === "on" || value === "true";
}
