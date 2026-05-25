import { prisma } from "@/server/db/client";

export type EmailSettingsRecord = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string | null;
  subscriptionReplyTo: string | null;
};

export async function getEmailSettings(): Promise<EmailSettingsRecord | null> {
  const settings = await prisma.emailSettings.findUnique({
    where: {
      id: "default",
    },
  });

  if (!settings) {
    return null;
  }

  return {
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFromEmail: settings.smtpFromEmail,
    smtpFromName: settings.smtpFromName,
    subscriptionReplyTo: settings.subscriptionReplyTo,
  };
}

export async function upsertEmailSettings(input: EmailSettingsRecord) {
  return prisma.emailSettings.upsert({
    where: {
      id: "default",
    },
    update: {
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpSecure: input.smtpSecure,
      smtpUser: input.smtpUser,
      smtpPass: input.smtpPass,
      smtpFromEmail: input.smtpFromEmail,
      smtpFromName: input.smtpFromName,
      subscriptionReplyTo: input.subscriptionReplyTo,
    },
    create: {
      id: "default",
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpSecure: input.smtpSecure,
      smtpUser: input.smtpUser,
      smtpPass: input.smtpPass,
      smtpFromEmail: input.smtpFromEmail,
      smtpFromName: input.smtpFromName,
      subscriptionReplyTo: input.subscriptionReplyTo,
    },
  });
}
