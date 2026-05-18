import { prisma } from "@/server/db/client";
import { randomBytes } from "node:crypto";

export type PublicInteractionSettingsRecord = {
  commentsEnabled: boolean;
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
      },
      update: {
        authSecret,
      },
      select: {
        authSecret: true,
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
