"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { getSiteSettings, upsertSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export type SaveGeneralSettingsState = {
  error: string | null;
  success: string | null;
};

export async function saveGeneralSettingsAction(
  _previousState: SaveGeneralSettingsState,
  formData: FormData,
): Promise<SaveGeneralSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
    };
  }

  const siteName = getRequiredString(formData, "siteName", "站点名");
  const submittedSiteUrl = getRequiredUrl(formData, "siteUrl", "站点地址");
  const heroIntro = getOptionalString(formData, "heroIntro");
  const summary = getOptionalString(formData, "summary");
  const motto = getOptionalString(formData, "motto");

  try {
    const currentSettings = await getSiteSettings();

    await upsertSiteSettings({
      siteName,
      siteDescription: currentSettings?.siteDescription ?? siteConfig.description,
      siteUrl: submittedSiteUrl,
      locale: currentSettings?.locale ?? siteConfig.locale,
      authorName: currentSettings?.authorName ?? siteConfig.author,
      authorAvatarUrl: currentSettings?.authorAvatarUrl ?? null,
      heroIntro,
      summary,
      motto,
      email: currentSettings?.email ?? null,
      githubUrl: currentSettings?.githubUrl ?? null,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存常规设置时出错了。",
      success: null,
    };
  }

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/updates");
  revalidatePath("/timeline");
  revalidatePath("/more");
  revalidatePath("/message");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  return {
    error: null,
    success: "常规设置已更新。",
  };
}

function getRequiredString(formData: FormData, key: string, label: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    throw new Error(`请填写${label}。`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseUrl(value: string, label: string) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`请填写有效的${label}。`);
  }
}

function getRequiredUrl(formData: FormData, key: string, label: string) {
  const value = getRequiredString(formData, key, label);
  return parseUrl(value, label);
}
