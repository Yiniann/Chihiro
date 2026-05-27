"use server";

import { createFriendLinkApplication } from "@/server/repositories/friend-link-applications";

export type SubmitFriendLinkApplicationState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function submitFriendLinkApplicationAction(
  _previousState: SubmitFriendLinkApplicationState,
  formData: FormData,
): Promise<SubmitFriendLinkApplicationState> {
  try {
    await createFriendLinkApplication({
      nickname: getRequiredString(formData, "nickname", "请填写昵称。", 40),
      siteName: getRequiredString(formData, "siteName", "请填写站点名称。", 80),
      siteUrl: normalizeUrl(getRequiredString(formData, "siteUrl", "请填写站点地址。", 200), "站点地址"),
      description: getOptionalString(formData, "description", 240),
      avatarUrl: getOptionalUrl(formData, "avatarUrl", "头像地址"),
      rssUrl: getOptionalUrl(formData, "rssUrl", "RSS 地址"),
      contactEmail: getRequiredEmail(formData, "contactEmail"),
      message: getOptionalString(formData, "message", 600),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "提交友链申请时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  return {
    error: null,
    success: "申请已经收到了，等你站内的小路通到这里，我会在后台认真看。",
    nonce: Date.now(),
  };
}

function getRequiredString(formData: FormData, key: string, message: string, maxLength: number) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new Error(`“${key}”内容太长了。`);
  }

  return normalized;
}

function getOptionalString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`“${key}”内容太长了。`);
  }

  return normalized;
}

function getRequiredEmail(formData: FormData, key: string) {
  const value = getRequiredString(formData, key, "请填写联系邮箱。", 254).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("请填写有效邮箱。");
  }

  return value;
}

function getOptionalUrl(formData: FormData, key: string, label: string) {
  const value = getOptionalString(formData, key, 500);
  return value ? normalizeUrl(value, label) : null;
}

function normalizeUrl(value: string, label: string) {
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(normalized).toString();
  } catch {
    throw new Error(`${label}不是有效链接。`);
  }
}
