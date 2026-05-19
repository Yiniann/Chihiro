export const SOCIAL_LINK_PLATFORM_ORDER = [
  "email",
  "github",
  "instagram",
  "x",
  "telegram",
  "whatsapp",
  "bilibili",
] as const;

export type SocialLinkPlatform = (typeof SOCIAL_LINK_PLATFORM_ORDER)[number];

export type SocialLink = {
  platform: SocialLinkPlatform;
  label: string;
  href: string;
};

type SocialLinkConfig = {
  label: string;
  placeholder: string;
  normalize: (input: string) => string | null;
};

const socialLinkConfigs: Record<SocialLinkPlatform, SocialLinkConfig> = {
  bilibili: {
    label: "Bilibili",
    placeholder: "https://space.bilibili.com/123456",
    normalize: normalizeHttpUrl,
  },
  telegram: {
    label: "Telegram",
    placeholder: "https://t.me/username",
    normalize: normalizeTelegramInput,
  },
  whatsapp: {
    label: "WhatsApp",
    placeholder: "https://wa.me/8613800138000",
    normalize: normalizeWhatsappInput,
  },
  email: {
    label: "Email",
    placeholder: "name@example.com",
    normalize: normalizeEmailInput,
  },
  github: {
    label: "GitHub",
    placeholder: "https://github.com/username",
    normalize: normalizeHttpUrl,
  },
  instagram: {
    label: "Instagram",
    placeholder: "https://instagram.com/username",
    normalize: normalizeInstagramInput,
  },
  x: {
    label: "推特 / X",
    placeholder: "https://x.com/username",
    normalize: normalizeXInput,
  },
};

export function getSocialLinkLabel(platform: SocialLinkPlatform) {
  return socialLinkConfigs[platform].label;
}

export function getSocialLinkPlaceholder(platform: SocialLinkPlatform) {
  return socialLinkConfigs[platform].placeholder;
}

export function normalizeSocialLinkInput(platform: SocialLinkPlatform, input: string) {
  return socialLinkConfigs[platform].normalize(input.trim());
}

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const links: SocialLink[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const platform = (item as { platform?: unknown }).platform;
    const href = (item as { href?: unknown }).href;

    if (!isSocialLinkPlatform(platform) || typeof href !== "string" || !href.trim()) {
      continue;
    }

    links.push({
      platform,
      label: getSocialLinkLabel(platform),
      href: href.trim(),
    });
  }

  return dedupeSocialLinks(links);
}

export function buildSocialLinksRecord(value: unknown) {
  const links = parseSocialLinks(value);

  return SOCIAL_LINK_PLATFORM_ORDER.reduce<Record<SocialLinkPlatform, string>>(
    (result, platform) => {
      result[platform] = links.find((link) => link.platform === platform)?.href ?? "";
      return result;
    },
    {
      email: "",
      github: "",
      instagram: "",
      x: "",
      telegram: "",
      whatsapp: "",
      bilibili: "",
    },
  );
}

export function buildSocialLinksPayload(
  entries: Partial<Record<SocialLinkPlatform, string>>,
): SocialLink[] {
  const links: SocialLink[] = [];

  for (const platform of SOCIAL_LINK_PLATFORM_ORDER) {
    const normalized = normalizeSocialLinkInput(platform, entries[platform] ?? "");

    if (normalized) {
      links.push({
        platform,
        label: getSocialLinkLabel(platform),
        href: normalized,
      });
    }
  }

  return dedupeSocialLinks(links);
}

function dedupeSocialLinks(links: SocialLink[]) {
  const seen = new Set<SocialLinkPlatform>();
  return links.filter((link) => {
    if (seen.has(link.platform)) {
      return false;
    }

    seen.add(link.platform);
    return true;
  });
}

function isSocialLinkPlatform(value: unknown): value is SocialLinkPlatform {
  return typeof value === "string" && SOCIAL_LINK_PLATFORM_ORDER.includes(value as SocialLinkPlatform);
}

function normalizeHttpUrl(input: string) {
  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeEmailInput(input: string) {
  if (!input) {
    return null;
  }

  const email = input.replace(/^mailto:/i, "").trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return null;
  }

  return `mailto:${email}`;
}

function normalizeTelegramInput(input: string) {
  if (!input) {
    return null;
  }

  if (input.startsWith("@")) {
    const username = input.slice(1).trim();
    return username ? `https://t.me/${username}` : null;
  }

  return normalizeHttpUrl(input);
}

function normalizeWhatsappInput(input: string) {
  if (!input) {
    return null;
  }

  if (/^\+?\d+$/.test(input)) {
    const digits = input.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  return normalizeHttpUrl(input);
}

function normalizeXInput(input: string) {
  if (!input) {
    return null;
  }

  if (input.startsWith("@")) {
    const username = input.slice(1).trim();
    return username ? `https://x.com/${username}` : null;
  }

  return normalizeHttpUrl(input);
}

function normalizeInstagramInput(input: string) {
  if (!input) {
    return null;
  }

  if (input.startsWith("@")) {
    const username = input.slice(1).trim();
    return username ? `https://instagram.com/${username}` : null;
  }

  return normalizeHttpUrl(input);
}
