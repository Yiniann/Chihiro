import { getEmailSettings, type EmailSettingsRecord } from "@/server/repositories/email-settings";

export type ResolvedEmailSettings = EmailSettingsRecord;

export async function getResolvedEmailSettings(): Promise<ResolvedEmailSettings | null> {
  const dbSettings = await getEmailSettings();
  const envSettings = getEmailSettingsFromEnv();

  if (!dbSettings && !envSettings) {
    return null;
  }

  const merged = {
    smtpHost: dbSettings?.smtpHost ?? envSettings?.smtpHost ?? "",
    smtpPort: dbSettings?.smtpPort ?? envSettings?.smtpPort ?? 587,
    smtpSecure: dbSettings?.smtpSecure ?? envSettings?.smtpSecure ?? false,
    smtpUser: dbSettings?.smtpUser ?? envSettings?.smtpUser ?? "",
    smtpPass: dbSettings?.smtpPass ?? envSettings?.smtpPass ?? "",
    smtpFromEmail: dbSettings?.smtpFromEmail ?? envSettings?.smtpFromEmail ?? "",
    smtpFromName: dbSettings?.smtpFromName ?? envSettings?.smtpFromName ?? null,
    subscriptionReplyTo:
      dbSettings?.subscriptionReplyTo ?? envSettings?.subscriptionReplyTo ?? null,
  } satisfies ResolvedEmailSettings;

  if (
    !merged.smtpHost ||
    !merged.smtpPort ||
    !merged.smtpUser ||
    !merged.smtpPass ||
    !merged.smtpFromEmail
  ) {
    return null;
  }

  return merged;
}

function getEmailSettingsFromEnv(): ResolvedEmailSettings | null {
  const smtpHost = normalizeString(process.env.SMTP_HOST);
  const smtpPort = parsePort(process.env.SMTP_PORT);
  const smtpSecure = parseBoolean(process.env.SMTP_SECURE);
  const smtpUser = normalizeString(process.env.SMTP_USER);
  const smtpPass = normalizeString(process.env.SMTP_PASS);
  const smtpFromEmail = normalizeString(process.env.SMTP_FROM_EMAIL);
  const smtpFromName = normalizeString(process.env.SMTP_FROM_NAME);
  const subscriptionReplyTo = normalizeString(process.env.SMTP_REPLY_TO);

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFromEmail) {
    return null;
  }

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    smtpFromEmail,
    smtpFromName,
    subscriptionReplyTo,
  };
}

function normalizeString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parsePort(value: string | undefined) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const port = Number(normalized);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

function parseBoolean(value: string | undefined) {
  const normalized = normalizeString(value)?.toLowerCase();
  return normalized === "true" || normalized === "1";
}
