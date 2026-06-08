"use server";

import { revalidatePath } from "next/cache";
import { resolveAbsoluteAssetUrl, resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { sendMail } from "@/server/mail/send-mail";
import { buildSubscriptionConfirmationTemplate } from "@/server/mail/templates/subscription-confirmation";
import { getPublicSiteSettings } from "@/server/public-content";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import {
  findSubscriberByEmail,
  upsertPendingSubscriber,
} from "@/server/repositories/subscribers";

export type SubscribeState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function subscribeAction(
  _previousState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  try {
    const email = getRequiredEmail(formData, "email");
    const preferences = getSubscriptionPreferences(formData);
    const interactionSettings = await getPublicInteractionSettings();

    if (!interactionSettings.subscriptionsEnabled) {
      throw new Error("订阅功能暂未开启。");
    }

    const siteSettings = await getPublicSiteSettings();
    const siteName = siteSettings.siteName ?? siteConfig.name;
    const siteUrl = resolveCanonicalSiteUrl(siteSettings);
    const authorAvatarUrl = resolveAbsoluteAssetUrl(siteSettings.authorAvatarUrl, siteSettings);
    const existing = await findSubscriberByEmail(email);

    if (existing?.status === "ACTIVE") {
      await upsertPendingSubscriber({
        email,
        confirmToken: existing.confirmToken,
        unsubscribeToken: existing.unsubscribeToken,
        subscribedToPosts: preferences.subscribedToPosts,
        subscribedToUpdates: preferences.subscribedToUpdates,
        source: "site-footer",
      });

      return {
        error: null,
        success: "这个邮箱已经订阅成功，订阅偏好也已经更新。",
        nonce: Date.now(),
      };
    }

    const confirmToken = crypto.randomUUID();
    const unsubscribeToken = existing?.unsubscribeToken ?? crypto.randomUUID();
    const confirmUrl = new URL(`/subscribe/confirm?token=${encodeURIComponent(confirmToken)}`, siteUrl)
      .toString();
    const unsubscribeUrl = new URL(
      `/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
      siteUrl,
    ).toString();

    await upsertPendingSubscriber({
      email,
      confirmToken,
      unsubscribeToken,
      subscribedToPosts: preferences.subscribedToPosts,
      subscribedToUpdates: preferences.subscribedToUpdates,
      source: "site-footer",
    });

    const template = buildSubscriptionConfirmationTemplate({
      siteName,
      avatarUrl: authorAvatarUrl,
      confirmUrl,
      unsubscribeUrl,
      subject: interactionSettings.subscriptionConfirmSubject,
      headline: interactionSettings.subscriptionConfirmHeadline,
      body: interactionSettings.subscriptionConfirmBody,
      ctaLabel: interactionSettings.subscriptionConfirmCtaLabel,
    });

    await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "订阅请求提交失败。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/");

  return {
    error: null,
    success: "确认邮件已经发出，请去邮箱里完成订阅确认。",
    nonce: Date.now(),
  };
}

function getRequiredEmail(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("请填写邮箱地址。");
  }

  const normalized = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("请填写有效的邮箱地址。");
  }

  return normalized;
}

function getSubscriptionPreferences(formData: FormData) {
  const subscribedToPosts = formData.get("subscribedToPosts") === "1";
  const subscribedToUpdates = formData.get("subscribedToUpdates") === "1";

  if (!subscribedToPosts && !subscribedToUpdates) {
    throw new Error("请至少选择一种订阅内容。");
  }

  return {
    subscribedToPosts,
    subscribedToUpdates,
  };
}
