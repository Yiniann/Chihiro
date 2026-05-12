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
};

export type PublicInteractionSettingsInput = Omit<
  PublicInteractionSettingsRecord,
  "hasAuthSecret" | "hasGithubClientSecret"
> & {
  authSecret?: string | null;
  githubClientSecret?: string | null;
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
  };
}

export async function upsertPublicInteractionSettings(
  input: PublicInteractionSettingsInput,
): Promise<PublicInteractionSettingsRecord> {
  const { authSecret, githubClientSecret, ...safeInput } = input;
  const secretData =
    {
      ...(typeof authSecret === "string" ? { authSecret } : {}),
      ...(typeof githubClientSecret === "string" ? { githubClientSecret } : {}),
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
      },
    });
  }

  if (!settings?.githubLoginEnabled) {
    return {
      authSecret: authSecret || null,
      githubCredentials: null,
    };
  }

  const clientId = settings.githubClientId?.trim() || process.env.AUTH_GITHUB_ID?.trim();
  const clientSecret =
    settings.githubClientSecret?.trim() || process.env.AUTH_GITHUB_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      authSecret: authSecret || null,
      githubCredentials: null,
    };
  }

  return {
    authSecret: authSecret || null,
    githubCredentials: {
      clientId,
      clientSecret,
    },
  };
}
