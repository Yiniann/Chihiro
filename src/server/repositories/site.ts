import { prisma } from "@/server/db/client";

export type SiteSettingsRecord = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  authorName: string;
  authorAvatarUrl: string | null;
  siteSubtitle: string | null;
  heroIntro: string | null;
  summary: string | null;
  motto: string | null;
  email: string | null;
  githubUrl: string | null;
  tmdbApiKey: string | null;
  movieSource: string | null;
  musicSource: string | null;
  projectsGitHubUsername: string | null;
  hiddenProjectSlugs: string[];
  siteLiveVisitorsEnabled: boolean;
  postReadingPresenceEnabled: boolean;
  standalonePageReadingPresenceEnabled: boolean;
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
    siteSubtitle: settings.siteSubtitle,
    heroIntro: settings.heroIntro,
    summary: settings.summary,
    motto: settings.motto,
    email: settings.email,
    githubUrl: settings.githubUrl,
    tmdbApiKey: settings.tmdbApiKey,
    movieSource: settings.movieSource,
    musicSource: settings.musicSource,
    projectsGitHubUsername: settings.projectsGitHubUsername,
    hiddenProjectSlugs: settings.hiddenProjectSlugs,
    siteLiveVisitorsEnabled: settings.siteLiveVisitorsEnabled,
    postReadingPresenceEnabled: settings.postReadingPresenceEnabled,
    standalonePageReadingPresenceEnabled: settings.standalonePageReadingPresenceEnabled,
  };
}

export async function getSiteCreatedAt(): Promise<string | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: {
      id: "default",
    },
    select: {
      createdAt: true,
    },
  });

  return settings?.createdAt.toISOString() ?? null;
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
      siteSubtitle: input.siteSubtitle,
      heroIntro: input.heroIntro,
      summary: input.summary,
      motto: input.motto,
      email: input.email,
      githubUrl: input.githubUrl,
      tmdbApiKey: input.tmdbApiKey,
      movieSource: input.movieSource,
      musicSource: input.musicSource,
      projectsGitHubUsername: input.projectsGitHubUsername,
      hiddenProjectSlugs: input.hiddenProjectSlugs,
      siteLiveVisitorsEnabled: input.siteLiveVisitorsEnabled,
      postReadingPresenceEnabled: input.postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled: input.standalonePageReadingPresenceEnabled,
    },
    create: {
      id: "default",
      siteName: input.siteName,
      siteDescription: input.siteDescription,
      siteUrl: input.siteUrl,
      locale: input.locale,
      authorName: input.authorName,
      authorAvatarUrl: input.authorAvatarUrl,
      siteSubtitle: input.siteSubtitle,
      heroIntro: input.heroIntro,
      summary: input.summary,
      motto: input.motto,
      email: input.email,
      githubUrl: input.githubUrl,
      tmdbApiKey: input.tmdbApiKey,
      movieSource: input.movieSource,
      musicSource: input.musicSource,
      projectsGitHubUsername: input.projectsGitHubUsername,
      hiddenProjectSlugs: input.hiddenProjectSlugs,
      siteLiveVisitorsEnabled: input.siteLiveVisitorsEnabled,
      postReadingPresenceEnabled: input.postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled: input.standalonePageReadingPresenceEnabled,
    },
  });
}
