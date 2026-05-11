import { prisma } from "@/server/db/client";

export type PublicInteractionSettingsRecord = {
  commentsEnabled: boolean;
  loginRequiredToComment: boolean;
  commentModeration: boolean;
  githubLoginEnabled: boolean;
  googleLoginEnabled: boolean;
};

export const defaultPublicInteractionSettings: PublicInteractionSettingsRecord = {
  commentsEnabled: false,
  loginRequiredToComment: true,
  commentModeration: true,
  githubLoginEnabled: true,
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
    googleLoginEnabled: settings.googleLoginEnabled,
  };
}

export async function upsertPublicInteractionSettings(
  input: PublicInteractionSettingsRecord,
): Promise<PublicInteractionSettingsRecord> {
  const settings = await prisma.publicInteractionSettings.upsert({
    where: {
      id: "default",
    },
    create: {
      id: "default",
      ...input,
    },
    update: input,
  });

  return {
    commentsEnabled: settings.commentsEnabled,
    loginRequiredToComment: settings.loginRequiredToComment,
    commentModeration: settings.commentModeration,
    githubLoginEnabled: settings.githubLoginEnabled,
    googleLoginEnabled: settings.googleLoginEnabled,
  };
}
