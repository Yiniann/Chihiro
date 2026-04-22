import { prisma } from "@/server/db/client";

export type SiteSettingsRecord = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  authorName: string;
  authorAvatarUrl: string | null;
  heroIntro: string | null;
  summary: string | null;
  motto: string | null;
  email: string | null;
  githubUrl: string | null;
};

export async function getSiteSettings(): Promise<SiteSettingsRecord | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: {
      id: "default",
    },
  });

  if (!settings) {
    return null;
  }

  return {
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    siteUrl: settings.siteUrl,
    locale: settings.locale,
    authorName: settings.authorName,
    authorAvatarUrl: settings.authorAvatarUrl,
    heroIntro: settings.heroIntro,
    summary: settings.summary,
    motto: settings.motto,
    email: settings.email,
    githubUrl: settings.githubUrl,
  };
}

export async function upsertSiteSettings(input: SiteSettingsRecord) {
  return prisma.siteSettings.upsert({
    where: {
      id: "default",
    },
    update: {
      siteName: input.siteName,
      siteDescription: input.siteDescription,
      siteUrl: input.siteUrl,
      locale: input.locale,
      authorName: input.authorName,
      authorAvatarUrl: input.authorAvatarUrl,
      heroIntro: input.heroIntro,
      summary: input.summary,
      motto: input.motto,
      email: input.email,
      githubUrl: input.githubUrl,
    },
    create: {
      id: "default",
      siteName: input.siteName,
      siteDescription: input.siteDescription,
      siteUrl: input.siteUrl,
      locale: input.locale,
      authorName: input.authorName,
      authorAvatarUrl: input.authorAvatarUrl,
      heroIntro: input.heroIntro,
      summary: input.summary,
      motto: input.motto,
      email: input.email,
      githubUrl: input.githubUrl,
    },
  });
}
