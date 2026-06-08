import { prisma } from "@/server/db/client";
import { randomBytes } from "node:crypto";
import { subscriptionMailTemplateDefaults } from "@/lib/subscription-mail-templates";

export type PublicInteractionSettingsRecord = {
  commentsEnabled: boolean;
  subscriptionsEnabled: boolean;
  subscriptionConfirmSubject: string;
  subscriptionConfirmHeadline: string;
  subscriptionConfirmBody: string;
  subscriptionConfirmCtaLabel: string;
  postNotificationSubject: string;
  postNotificationHeadline: string;
  postNotificationBody: string;
  postNotificationCtaLabel: string;
  updateNotificationSubject: string;
  updateNotificationHeadline: string;
  updateNotificationBody: string;
  updateNotificationCtaLabel: string;
  loginRequiredToComment: boolean;
  commentModeration: boolean;
  githubLoginEnabled: boolean;
  hasAuthSecret: boolean;
  githubClientId: string | null;
  hasGithubClientSecret: boolean;
  googleLoginEnabled: boolean;
  googleClientId: string | null;
  hasGoogleClientSecret: boolean;
};

export type PublicInteractionSettingsInput = Omit<
  PublicInteractionSettingsRecord,
  "hasAuthSecret" | "hasGithubClientSecret" | "hasGoogleClientSecret"
> & {
  authSecret?: string | null;
  githubClientSecret?: string | null;
  googleClientSecret?: string | null;
};

export const defaultPublicInteractionSettings: PublicInteractionSettingsRecord = {
  commentsEnabled: false,
  subscriptionsEnabled: true,
  subscriptionConfirmSubject: subscriptionMailTemplateDefaults.subscriptionConfirmSubject,
  subscriptionConfirmHeadline: subscriptionMailTemplateDefaults.subscriptionConfirmHeadline,
  subscriptionConfirmBody: subscriptionMailTemplateDefaults.subscriptionConfirmBody,
  subscriptionConfirmCtaLabel: subscriptionMailTemplateDefaults.subscriptionConfirmCtaLabel,
  postNotificationSubject: subscriptionMailTemplateDefaults.postNotificationSubject,
  postNotificationHeadline: subscriptionMailTemplateDefaults.postNotificationHeadline,
  postNotificationBody: subscriptionMailTemplateDefaults.postNotificationBody,
  postNotificationCtaLabel: subscriptionMailTemplateDefaults.postNotificationCtaLabel,
  updateNotificationSubject: subscriptionMailTemplateDefaults.updateNotificationSubject,
  updateNotificationHeadline: subscriptionMailTemplateDefaults.updateNotificationHeadline,
  updateNotificationBody: subscriptionMailTemplateDefaults.updateNotificationBody,
  updateNotificationCtaLabel: subscriptionMailTemplateDefaults.updateNotificationCtaLabel,
  loginRequiredToComment: true,
  commentModeration: true,
  githubLoginEnabled: true,
  hasAuthSecret: false,
  githubClientId: null,
  hasGithubClientSecret: false,
  googleLoginEnabled: false,
  googleClientId: null,
  hasGoogleClientSecret: false,
};

export async function getPublicInteractionSettings(): Promise<PublicInteractionSettingsRecord> {
  const settings = await prisma.publicInteractionSettings.findUnique({
    where: {
      id: "default",
    },
  });

  if (!settings) {
    return defaultPublicInteractionSettings;
  }

  return {
    commentsEnabled: settings.commentsEnabled,
    subscriptionsEnabled: settings.subscriptionsEnabled,
    subscriptionConfirmSubject:
      settings.subscriptionConfirmSubject ?? defaultPublicInteractionSettings.subscriptionConfirmSubject,
    subscriptionConfirmHeadline:
      settings.subscriptionConfirmHeadline ?? defaultPublicInteractionSettings.subscriptionConfirmHeadline,
    subscriptionConfirmBody:
      settings.subscriptionConfirmBody ?? defaultPublicInteractionSettings.subscriptionConfirmBody,
    subscriptionConfirmCtaLabel:
      settings.subscriptionConfirmCtaLabel ?? defaultPublicInteractionSettings.subscriptionConfirmCtaLabel,
    postNotificationSubject:
      settings.postNotificationSubject ?? defaultPublicInteractionSettings.postNotificationSubject,
    postNotificationHeadline:
      settings.postNotificationHeadline ?? defaultPublicInteractionSettings.postNotificationHeadline,
    postNotificationBody:
      settings.postNotificationBody ?? defaultPublicInteractionSettings.postNotificationBody,
    postNotificationCtaLabel:
      settings.postNotificationCtaLabel ?? defaultPublicInteractionSettings.postNotificationCtaLabel,
    updateNotificationSubject:
      settings.updateNotificationSubject ?? defaultPublicInteractionSettings.updateNotificationSubject,
    updateNotificationHeadline:
      settings.updateNotificationHeadline ?? defaultPublicInteractionSettings.updateNotificationHeadline,
    updateNotificationBody:
      settings.updateNotificationBody ?? defaultPublicInteractionSettings.updateNotificationBody,
    updateNotificationCtaLabel:
      settings.updateNotificationCtaLabel ?? defaultPublicInteractionSettings.updateNotificationCtaLabel,
    loginRequiredToComment: settings.loginRequiredToComment,
    commentModeration: settings.commentModeration,
    githubLoginEnabled: settings.githubLoginEnabled,
    hasAuthSecret: Boolean(settings.authSecret),
    githubClientId: settings.githubClientId,
    hasGithubClientSecret: Boolean(settings.githubClientSecret),
    googleLoginEnabled: settings.googleLoginEnabled,
    googleClientId: settings.googleClientId,
    hasGoogleClientSecret: Boolean(settings.googleClientSecret),
  };
}

export async function upsertPublicInteractionSettings(
  input: PublicInteractionSettingsInput,
): Promise<PublicInteractionSettingsRecord> {
  const { authSecret, githubClientSecret, googleClientSecret, ...safeInput } = input;
  const secretData =
    {
      ...(typeof authSecret === "string" ? { authSecret } : {}),
      ...(typeof githubClientSecret === "string" ? { githubClientSecret } : {}),
      ...(typeof googleClientSecret === "string" ? { googleClientSecret } : {}),
    };
  const settings = await prisma.publicInteractionSettings.upsert({
    where: {
      id: "default",
    },
    create: {
      id: "default",
      ...safeInput,
      ...secretData,
    },
    update: {
      ...safeInput,
      ...secretData,
    },
  });

  return {
    commentsEnabled: settings.commentsEnabled,
    subscriptionsEnabled: settings.subscriptionsEnabled,
    subscriptionConfirmSubject:
      settings.subscriptionConfirmSubject ?? defaultPublicInteractionSettings.subscriptionConfirmSubject,
    subscriptionConfirmHeadline:
      settings.subscriptionConfirmHeadline ?? defaultPublicInteractionSettings.subscriptionConfirmHeadline,
    subscriptionConfirmBody:
      settings.subscriptionConfirmBody ?? defaultPublicInteractionSettings.subscriptionConfirmBody,
    subscriptionConfirmCtaLabel:
      settings.subscriptionConfirmCtaLabel ?? defaultPublicInteractionSettings.subscriptionConfirmCtaLabel,
    postNotificationSubject:
      settings.postNotificationSubject ?? defaultPublicInteractionSettings.postNotificationSubject,
    postNotificationHeadline:
      settings.postNotificationHeadline ?? defaultPublicInteractionSettings.postNotificationHeadline,
    postNotificationBody:
      settings.postNotificationBody ?? defaultPublicInteractionSettings.postNotificationBody,
    postNotificationCtaLabel:
      settings.postNotificationCtaLabel ?? defaultPublicInteractionSettings.postNotificationCtaLabel,
    updateNotificationSubject:
      settings.updateNotificationSubject ?? defaultPublicInteractionSettings.updateNotificationSubject,
    updateNotificationHeadline:
      settings.updateNotificationHeadline ?? defaultPublicInteractionSettings.updateNotificationHeadline,
    updateNotificationBody:
      settings.updateNotificationBody ?? defaultPublicInteractionSettings.updateNotificationBody,
    updateNotificationCtaLabel:
      settings.updateNotificationCtaLabel ?? defaultPublicInteractionSettings.updateNotificationCtaLabel,
    loginRequiredToComment: settings.loginRequiredToComment,
    commentModeration: settings.commentModeration,
    githubLoginEnabled: settings.githubLoginEnabled,
    hasAuthSecret: Boolean(settings.authSecret),
    githubClientId: settings.githubClientId,
    hasGithubClientSecret: Boolean(settings.githubClientSecret),
    googleLoginEnabled: settings.googleLoginEnabled,
    googleClientId: settings.googleClientId,
    hasGoogleClientSecret: Boolean(settings.googleClientSecret),
  };
}

export async function getPublicAuthConfig() {
  let settings = await prisma.publicInteractionSettings.findUnique({
    where: {
      id: "default",
    },
    select: {
      authSecret: true,
      subscriptionsEnabled: true,
      githubLoginEnabled: true,
      githubClientId: true,
      githubClientSecret: true,
      googleLoginEnabled: true,
      googleClientId: true,
      googleClientSecret: true,
    },
  });
  const envAuthSecret = process.env.AUTH_SECRET?.trim();
  let authSecret = settings?.authSecret?.trim() || envAuthSecret;

  if (!authSecret) {
    authSecret = randomBytes(32).toString("base64url");
    settings = await prisma.publicInteractionSettings.upsert({
      where: {
        id: "default",
      },
      create: {
        id: "default",
        authSecret,
        subscriptionsEnabled: defaultPublicInteractionSettings.subscriptionsEnabled,
      },
      update: {
        authSecret,
      },
      select: {
        authSecret: true,
        subscriptionsEnabled: true,
        githubLoginEnabled: true,
        githubClientId: true,
        githubClientSecret: true,
        googleLoginEnabled: true,
        googleClientId: true,
        googleClientSecret: true,
      },
    });
  }
  const githubClientId = settings?.githubClientId?.trim() || process.env.AUTH_GITHUB_ID?.trim();
  const githubClientSecret =
    settings?.githubClientSecret?.trim() || process.env.AUTH_GITHUB_SECRET?.trim();
  const googleClientId = settings?.googleClientId?.trim() || process.env.AUTH_GOOGLE_ID?.trim();
  const googleClientSecret =
    settings?.googleClientSecret?.trim() || process.env.AUTH_GOOGLE_SECRET?.trim();

  return {
    authSecret: authSecret || null,
    githubCredentials:
      settings?.githubLoginEnabled && githubClientId && githubClientSecret
        ? {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }
        : null,
    googleCredentials:
      settings?.googleLoginEnabled && googleClientId && googleClientSecret
        ? {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }
        : null,
  };
}
