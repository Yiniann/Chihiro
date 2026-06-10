"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { getSiteSettings, upsertSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export type SaveMediaSettingsState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveMediaSettingsAction(
  _previousState: SaveMediaSettingsState,
  formData: FormData,
): Promise<SaveMediaSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  const tmdbApiKey = getOptionalString(formData, "tmdbApiKey");
  const movieSource = getOptionalString(formData, "movieSource") ?? "tmdb";
  const musicSource = getOptionalString(formData, "musicSource") ?? "apple-music";

  try {
    const currentSettings = await getSiteSettings();

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
      tmdbApiKey,
      movieSource,
      musicSource,
      projectsGitHubUsername: currentSettings?.projectsGitHubUsername ?? null,
      hiddenProjectSlugs: currentSettings?.hiddenProjectSlugs ?? [],
      siteLiveVisitorsEnabled: currentSettings?.siteLiveVisitorsEnabled ?? true,
      postReadingPresenceEnabled: currentSettings?.postReadingPresenceEnabled ?? true,
      standalonePageReadingPresenceEnabled:
        currentSettings?.standalonePageReadingPresenceEnabled ?? true,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存内容源设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/media");

  return {
    error: null,
    success: "内容源设置已更新。",
    nonce: Date.now(),
  };
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}
