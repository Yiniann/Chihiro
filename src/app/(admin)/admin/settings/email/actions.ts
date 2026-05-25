"use server";

import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { sendMail } from "@/server/mail/send-mail";
import { buildTestEmailTemplate } from "@/server/mail/templates/test-email";
import {
  getEmailSettings,
  upsertEmailSettings,
} from "@/server/repositories/email-settings";
import { getSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export type SaveEmailSettingsState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export type SendTestEmailState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveEmailSettingsAction(
  _previousState: SaveEmailSettingsState,
  formData: FormData,
): Promise<SaveEmailSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改设置。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const currentSettings = await getEmailSettings();
    const smtpHost = getRequiredString(formData, "smtpHost", "SMTP 主机");
    const smtpPort = getRequiredPort(formData, "smtpPort", "SMTP 端口");
    const smtpSecure = getOptionalString(formData, "smtpSecure") === "1";
    const smtpUser = getRequiredString(formData, "smtpUser", "SMTP 用户名");
    const submittedSmtpPass = getOptionalString(formData, "smtpPass");
    const smtpPass = submittedSmtpPass ?? currentSettings?.smtpPass;
    const smtpFromEmail = getRequiredEmail(formData, "smtpFromEmail", "发件邮箱");
    const smtpFromName = getOptionalString(formData, "smtpFromName");
    const subscriptionReplyTo = getOptionalEmail(
      formData,
      "subscriptionReplyTo",
      "回复邮箱",
    );

    if (!smtpPass) {
      throw new Error("请填写 SMTP 密码。");
    }

    await upsertEmailSettings({
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFromEmail,
      smtpFromName,
      subscriptionReplyTo,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存邮件设置时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/email");

  return {
    error: null,
    success: "邮件设置已更新。",
    nonce: Date.now(),
  };
}

export async function sendTestEmailAction(
  _previousState: SendTestEmailState,
  formData: FormData,
): Promise<SendTestEmailState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能发送测试邮件。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const to = getRequiredEmail(formData, "testRecipient", "测试收件邮箱");
    const siteSettings = await getSiteSettings();
    const siteName = siteSettings?.siteName ?? siteConfig.name;
    const template = buildTestEmailTemplate({ siteName });

    await sendMail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "测试邮件发送失败。",
      success: null,
      nonce: Date.now(),
    };
  }

  return {
    error: null,
    success: "测试邮件已发送，请检查收件箱。",
    nonce: Date.now(),
  };
}

function getRequiredString(formData: FormData, key: string, label: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    throw new Error(`请填写 ${label}。`);
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

function getRequiredPort(formData: FormData, key: string, label: string) {
  const value = getRequiredString(formData, key, label);

  if (!/^\d+$/.test(value)) {
    throw new Error(`请填写有效的 ${label}。`);
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`请填写有效的 ${label}。`);
  }

  return port;
}

function getRequiredEmail(formData: FormData, key: string, label: string) {
  const value = getRequiredString(formData, key, label);
  return parseEmail(value, label);
}

function getOptionalEmail(formData: FormData, key: string, label: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  return parseEmail(value, label);
}

function parseEmail(value: string, label: string) {
  const normalized = value.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error(`请填写有效的 ${label}。`);
  }

  return normalized;
}
