import { DEFAULT_HERO_INTRO } from "@/lib/hero-copy";

const defaultSiteUrl = "http://localhost:3000";

export const siteConfig = {
  name: "Chihiro",
  description: "A publishing system for stories, ideas, and product notes.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl,
  avatar: "/avatar.png",
  author: "Yinian",
  locale: "zh-CN",
  motto: "It is the time you have wasted for your rose\nmakes your rose so important.",
  heroIntro: DEFAULT_HERO_INTRO,
  summary:
    "This is where I share projects, experiments, and reflections on building, learning, and the things that keep me curious.",
  email:"i@xiamii.com",
  github: "https://github.com/Yiniann",
};

function normalizeSiteUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getEnvSiteUrl(): string | null {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function isSiteUrlLockedByEnv(): boolean {
  return getEnvSiteUrl() !== null;
}

export function resolveCanonicalSiteUrl(
  siteSettings?: { siteUrl?: string | null } | null,
): string {
  return (
    getEnvSiteUrl() ??
    normalizeSiteUrl(siteSettings?.siteUrl) ??
    normalizeSiteUrl(siteConfig.url) ??
    defaultSiteUrl
  );
}

export function canonicalUrl(
  path = "/",
  siteSettings?: { siteUrl?: string | null } | null,
): string {
  return new URL(path, resolveCanonicalSiteUrl(siteSettings)).toString();
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
