import { DEFAULT_HERO_INTRO } from "@/lib/hero-copy";

const defaultSiteUrl = "http://localhost:3000";

export const siteConfig = {
  name: "Chihiro",
  description: "A publishing system for stories, ideas, and product notes.",
  url: defaultSiteUrl,
  timeZone: "Asia/Shanghai",
  avatar: "/avatar.png",
  author: "Yinian",
  locale: "zh-CN",
  subtitle: "",
  motto: "It is the time you have wasted for your rose\nmakes your rose so important.",
  heroIntro: DEFAULT_HERO_INTRO,
  summary: "",
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

export function resolveCanonicalSiteUrl(
  siteSettings?: { siteUrl?: string | null } | null,
): string {
  return (
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

export function resolveAbsoluteAssetUrl(
  assetUrl: string | null | undefined,
  siteSettings?: { siteUrl?: string | null } | null,
): string | null {
  const normalized = assetUrl?.trim();

  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized, resolveCanonicalSiteUrl(siteSettings)).toString();
  } catch {
    return null;
  }
}
