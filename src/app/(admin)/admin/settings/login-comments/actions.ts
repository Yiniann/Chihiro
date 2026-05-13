"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { upsertPublicInteractionSettings } from "@/server/repositories/public-interactions";

export type SaveLoginCommentsSettingsState = {
  error: string | null;
  success: string | null;
};

export async function saveLoginCommentsSettingsAction(
  _previousState: SaveLoginCommentsSettingsState,
  formData: FormData,
): Promise<SaveLoginCommentsSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
    };
  }

  try {
    const commentsEnabled = getBoolean(formData, "commentsEnabled");
    const loginRequiredToComment = getBoolean(formData, "loginRequiredToComment");
    const commentModeration = getBoolean(formData, "commentModeration");
    const githubLoginEnabled = getBoolean(formData, "githubLoginEnabled");
    const authSecret = getOptionalString(formData, "authSecret");
    const githubClientId = getOptionalString(formData, "githubClientId");
    const githubClientSecret = getOptionalString(formData, "githubClientSecret");

    await upsertPublicInteractionSettings({
      commentsEnabled,
      loginRequiredToComment,
      commentModeration,
      githubLoginEnabled,
      authSecret,
      githubClientId,
      githubClientSecret,
      googleLoginEnabled: false,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存登录与评论设置时出错了。",
      success: null,
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/login-comments");
  revalidatePath("/posts");
  revalidatePath("/posts/[...slug]", "page");

  return {
    error: null,
    success: "登录与评论设置已更新。",
  };
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
