"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import {
  getPublicInteractionSettings,
  upsertPublicInteractionSettings,
} from "@/server/repositories/public-interactions";

export type SaveSubscriptionSettingsState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveSubscriptionSettingsAction(
  _previousState: SaveSubscriptionSettingsState,
  formData: FormData,
): Promise<SaveSubscriptionSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const currentSettings = await getPublicInteractionSettings();
    const subscriptionsEnabled = getBooleanField(
      formData,
      "subscriptionsEnabled",
      currentSettings.subscriptionsEnabled,
    );

    await upsertPublicInteractionSettings({
      commentsEnabled: currentSettings.commentsEnabled,
      subscriptionsEnabled,
      loginRequiredToComment: currentSettings.loginRequiredToComment,
      commentModeration: currentSettings.commentModeration,
      githubLoginEnabled: currentSettings.githubLoginEnabled,
      githubClientId: currentSettings.githubClientId,
      googleLoginEnabled: currentSettings.googleLoginEnabled,
      googleClientId: currentSettings.googleClientId,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存订阅设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/subscriptions");
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/posts/[...slug]", "page");

  return {
    error: null,
    success: "订阅设置已更新。",
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
