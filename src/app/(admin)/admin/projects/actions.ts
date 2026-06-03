"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth";
import { getGitHubUsernameFromUrl } from "@/server/github-projects";
import { getSiteSettings, upsertSiteSettings } from "@/server/repositories/site";
import { fallbackSiteSettings } from "@/content/fallback";

export async function saveProjectGitHubSourceAction(formData: FormData) {
  await requireAdminSession();

  const value = formData.get("githubUsername");
  const githubUsername = normalizeGitHubUsername(typeof value === "string" ? value : "");
  const currentSettings = (await getSiteSettings()) ?? fallbackSiteSettings;

  await upsertSiteSettings({
    ...currentSettings,
    projectsGitHubUsername: githubUsername,
    hiddenProjectSlugs:
      githubUsername === currentSettings.projectsGitHubUsername
        ? currentSettings.hiddenProjectSlugs
        : [],
  });

  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/sitemap.xml");
}

export async function toggleProjectVisibilityAction(formData: FormData) {
  await requireAdminSession();

  const slug = getProjectSlug(formData);
  const currentSettings = (await getSiteSettings()) ?? fallbackSiteSettings;
  const hiddenProjectSlugs = new Set(currentSettings.hiddenProjectSlugs);

  if (hiddenProjectSlugs.has(slug)) {
    hiddenProjectSlugs.delete(slug);
  } else {
    hiddenProjectSlugs.add(slug);
  }

  await upsertSiteSettings({
    ...currentSettings,
    hiddenProjectSlugs: Array.from(hiddenProjectSlugs).sort((left, right) =>
      left.localeCompare(right),
    ),
  });

  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/sitemap.xml");
}

function normalizeGitHubUsername(value: string) {
  const username = getGitHubUsernameFromUrl(value.trim());

  if (!username) {
    return null;
  }

  const normalized = username.replace(/^@/, "").trim();
  return normalized ? normalized : null;
}

function getProjectSlug(formData: FormData) {
  const value = formData.get("projectSlug");

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("缺少项目标识。");
  }

  return value.trim();
}
