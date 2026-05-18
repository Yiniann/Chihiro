"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import {
  getPublicInteractionSettings,
  upsertPublicInteractionSettings,
} from "@/server/repositories/public-interactions";

export type SaveLoginCommentsSettingsState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveLoginSettingsAction(
  _previousState: SaveLoginCommentsSettingsState,
  formData: FormData,
): Promise<SaveLoginCommentsSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const currentSettings = await getPublicInteractionSettings();
    const githubLoginEnabled = getBoolean(formData, "githubLoginEnabled");
    const authSecret = getOptionalStringField(formData, "authSecret");
    const githubClientIdField = getOptionalStringField(formData, "githubClientId");
    const githubClientSecret = getOptionalStringField(formData, "githubClientSecret");

    await upsertPublicInteractionSettings({
      commentsEnabled: currentSettings.commentsEnabled,
      loginRequiredToComment: currentSettings.loginRequiredToComment,
      commentModeration: currentSettings.commentModeration,
      githubLoginEnabled,
      authSecret,
      githubClientId:
        githubClientIdField === undefined
          ? currentSettings.githubClientId
          : githubClientIdField,
      githubClientSecret,
      googleLoginEnabled: false,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存登录设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/login");
  revalidatePath("/admin/settings/login-comments");
  revalidatePath("/posts");
  revalidatePath("/posts/[...slug]", "page");

  return {
    error: null,
    success: "登录设置已更新。",
    nonce: Date.now(),
  };
}

export async function saveCommentSettingsAction(
  _previousState: SaveLoginCommentsSettingsState,
  formData: FormData,
): Promise<SaveLoginCommentsSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const currentSettings = await getPublicInteractionSettings();
    const commentsEnabled = getBoolean(formData, "commentsEnabled");
    const loginRequiredToComment = getBooleanField(
      formData,
      "loginRequiredToComment",
      currentSettings.loginRequiredToComment,
    );
    const commentModeration = getBooleanField(
      formData,
      "commentModeration",
      currentSettings.commentModeration,
    );

    await upsertPublicInteractionSettings({
      commentsEnabled,
      loginRequiredToComment,
      commentModeration,
      githubLoginEnabled: currentSettings.githubLoginEnabled,
      githubClientId: currentSettings.githubClientId,
      googleLoginEnabled: currentSettings.googleLoginEnabled,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存评论设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/comments");
  revalidatePath("/admin/settings/login-comments");
  revalidatePath("/posts");
  revalidatePath("/posts/[...slug]", "page");

  return {
    error: null,
    success: "评论设置已更新。",
    nonce: Date.now(),
  };
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getBooleanField(formData: FormData, key: string, fallback: boolean) {
  if (!formData.has(key)) {
    return fallback;
  }

  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getOptionalStringField(formData: FormData, key: string) {
  if (!formData.has(key)) {
    return undefined;
  }

  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
