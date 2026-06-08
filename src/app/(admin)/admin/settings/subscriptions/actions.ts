"use server";

import { revalidatePath } from "next/cache";
import { subscriptionMailTemplateDefaults } from "@/lib/subscription-mail-templates";
import {
  isSubscriptionTemplateKey,
  type SubscriptionTemplateKey,
  subscriptionTemplateConfigs,
} from "@/app/(admin)/admin/settings/subscriptions/template-config";
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
      subscriptionConfirmSubject: currentSettings.subscriptionConfirmSubject,
      subscriptionConfirmHeadline: currentSettings.subscriptionConfirmHeadline,
      subscriptionConfirmBody: currentSettings.subscriptionConfirmBody,
      subscriptionConfirmCtaLabel: currentSettings.subscriptionConfirmCtaLabel,
      postNotificationSubject: currentSettings.postNotificationSubject,
      postNotificationHeadline: currentSettings.postNotificationHeadline,
      postNotificationBody: currentSettings.postNotificationBody,
      postNotificationCtaLabel: currentSettings.postNotificationCtaLabel,
      updateNotificationSubject: currentSettings.updateNotificationSubject,
      updateNotificationHeadline: currentSettings.updateNotificationHeadline,
      updateNotificationBody: currentSettings.updateNotificationBody,
      updateNotificationCtaLabel: currentSettings.updateNotificationCtaLabel,
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

export async function saveSubscriptionTemplateAction(
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
    const template = getRequiredTemplateKey(formData, "template");
    const currentSettings = await getPublicInteractionSettings();
    const fields = subscriptionTemplateConfigs[template].fields;
    const fallback = getTemplateFallbacks(template);

    await upsertPublicInteractionSettings({
      commentsEnabled: currentSettings.commentsEnabled,
      subscriptionsEnabled: currentSettings.subscriptionsEnabled,
      subscriptionConfirmSubject:
        template === "confirm"
          ? getOptionalStringField(formData, fields.subject, fallback.subject)
          : currentSettings.subscriptionConfirmSubject,
      subscriptionConfirmHeadline:
        template === "confirm"
          ? getOptionalStringField(formData, fields.headline, fallback.headline)
          : currentSettings.subscriptionConfirmHeadline,
      subscriptionConfirmBody:
        template === "confirm"
          ? getOptionalStringField(formData, fields.body, fallback.body)
          : currentSettings.subscriptionConfirmBody,
      subscriptionConfirmCtaLabel:
        template === "confirm"
          ? getOptionalStringField(formData, fields.ctaLabel, fallback.ctaLabel)
          : currentSettings.subscriptionConfirmCtaLabel,
      postNotificationSubject:
        template === "post"
          ? getOptionalStringField(formData, fields.subject, fallback.subject)
          : currentSettings.postNotificationSubject,
      postNotificationHeadline:
        template === "post"
          ? getOptionalStringField(formData, fields.headline, fallback.headline)
          : currentSettings.postNotificationHeadline,
      postNotificationBody:
        template === "post"
          ? getOptionalStringField(formData, fields.body, fallback.body)
          : currentSettings.postNotificationBody,
      postNotificationCtaLabel:
        template === "post"
          ? getOptionalStringField(formData, fields.ctaLabel, fallback.ctaLabel)
          : currentSettings.postNotificationCtaLabel,
      updateNotificationSubject:
        template === "update"
          ? getOptionalStringField(formData, fields.subject, fallback.subject)
          : currentSettings.updateNotificationSubject,
      updateNotificationHeadline:
        template === "update"
          ? getOptionalStringField(formData, fields.headline, fallback.headline)
          : currentSettings.updateNotificationHeadline,
      updateNotificationBody:
        template === "update"
          ? getOptionalStringField(formData, fields.body, fallback.body)
          : currentSettings.updateNotificationBody,
      updateNotificationCtaLabel:
        template === "update"
          ? getOptionalStringField(formData, fields.ctaLabel, fallback.ctaLabel)
          : currentSettings.updateNotificationCtaLabel,
      loginRequiredToComment: currentSettings.loginRequiredToComment,
      commentModeration: currentSettings.commentModeration,
      githubLoginEnabled: currentSettings.githubLoginEnabled,
      githubClientId: currentSettings.githubClientId,
      googleLoginEnabled: currentSettings.googleLoginEnabled,
      googleClientId: currentSettings.googleClientId,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存模板设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/subscriptions");
  revalidatePath("/admin/settings/subscriptions/[template]", "page");

  return {
    error: null,
    success: "邮件模板已更新。",
    nonce: Date.now(),
  };
}

function getOptionalStringField(formData: FormData, key: string, fallback: string) {
  if (!formData.has(key)) {
    return fallback;
  }

  const value = formData.get(key);

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function getBooleanField(formData: FormData, key: string, fallback: boolean) {
  if (!formData.has(key)) {
    return fallback;
  }

  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getRequiredTemplateKey(formData: FormData, key: string): SubscriptionTemplateKey {
  const value = formData.get(key);

  if (typeof value !== "string" || !isSubscriptionTemplateKey(value)) {
    throw new Error("无效的模板类型。");
  }

  return value;
}

function getTemplateFallbacks(template: SubscriptionTemplateKey) {
  if (template === "confirm") {
    return {
      subject: subscriptionMailTemplateDefaults.subscriptionConfirmSubject,
      headline: subscriptionMailTemplateDefaults.subscriptionConfirmHeadline,
      body: subscriptionMailTemplateDefaults.subscriptionConfirmBody,
      ctaLabel: subscriptionMailTemplateDefaults.subscriptionConfirmCtaLabel,
    };
  }

  if (template === "post") {
    return {
      subject: subscriptionMailTemplateDefaults.postNotificationSubject,
      headline: subscriptionMailTemplateDefaults.postNotificationHeadline,
      body: subscriptionMailTemplateDefaults.postNotificationBody,
      ctaLabel: subscriptionMailTemplateDefaults.postNotificationCtaLabel,
    };
  }

  return {
    subject: subscriptionMailTemplateDefaults.updateNotificationSubject,
    headline: subscriptionMailTemplateDefaults.updateNotificationHeadline,
    body: subscriptionMailTemplateDefaults.updateNotificationBody,
    ctaLabel: subscriptionMailTemplateDefaults.updateNotificationCtaLabel,
  };
}
