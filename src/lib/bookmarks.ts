import { BookmarkKind } from "@prisma/client";

export const bookmarkKindOptions = [
  { value: BookmarkKind.DOCS, label: "Docs" },
  { value: BookmarkKind.ARTICLE, label: "Article" },
  { value: BookmarkKind.TOOL, label: "Tool" },
  { value: BookmarkKind.COLLECTION, label: "Collection" },
] as const;

export function getBookmarkKindLabel(kind: BookmarkKind) {
  return bookmarkKindOptions.find((item) => item.value === kind)?.label ?? kind;
}

export function getBookmarkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function normalizeBookmarkUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("请填写 url。");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    throw new Error("请填写有效的 url。");
  }
}

export function getBookmarkFallbackLogoUrl(value: string) {
  try {
    const url = new URL(value);
    return new URL("/favicon.ico", url.origin).toString();
  } catch {
    return null;
  }
}

export function getBookmarkInitial(title: string, host: string) {
  const source = title.trim() || host.trim();
  return source.slice(0, 1).toUpperCase() || "?";
}

export async function resolveBookmarkLogoUrl(
  value: string,
  options?: {
    overrideUrl?: string | null;
  },
) {
  const pageUrl = new URL(value);
  const overrideUrl = normalizeOptionalBookmarkLogoOverrideUrl(
    options?.overrideUrl,
    pageUrl.toString(),
  );
  const candidates = overrideUrl
    ? [overrideUrl]
    : await collectBookmarkLogoCandidates(pageUrl.toString());

  for (const candidate of candidates) {
    const cached = await fetchBookmarkLogoAsDataUrl(candidate);

    if (cached) {
      return cached;
    }
  }

  return null;
}

async function collectBookmarkLogoCandidates(pageUrl: string) {
  const discovered = new Map<string, number>();
  const response = await fetch(pageUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error("目标站点暂时无法访问。");
  }

  const html = await response.text();
  const resolvedPageUrl = response.url;

  collectScoredCandidates(discovered, extractIconCandidates(html, resolvedPageUrl), 0);
  collectScoredCandidates(discovered, await extractManifestCandidates(html, resolvedPageUrl), 100);
  collectScoredCandidates(discovered, extractCommonLogoCandidates(resolvedPageUrl), 200);
  collectScoredCandidates(discovered, extractOpenGraphImageCandidates(html, resolvedPageUrl), 300);

  return Array.from(discovered.entries())
    .sort((left, right) => left[1] - right[1])
    .map(([candidate]) => candidate);
}

function collectScoredCandidates(target: Map<string, number>, candidates: string[], baseScore: number) {
  candidates.forEach((candidate, index) => {
    const current = target.get(candidate);
    const score = baseScore + index;

    if (current === undefined || score < current) {
      target.set(candidate, score);
    }
  });
}

function extractIconCandidates(html: string, pageUrl: string) {
  const candidates: Array<{ url: string; score: number }> = [];
  const linkTagPattern = /<link\b[^>]*?>/gi;

  for (const tag of html.match(linkTagPattern) ?? []) {
    const rel = readHtmlAttribute(tag, "rel")?.toLowerCase() ?? "";

    if ((!rel.includes("icon") && !rel.includes("apple-touch-icon")) || rel.includes("mask-icon")) {
      continue;
    }

    const href = readHtmlAttribute(tag, "href");

    if (!href) {
      continue;
    }

    const resolved = resolveHtmlAssetUrl(href, pageUrl);

    if (resolved) {
      candidates.push({
        url: resolved,
        score: scoreIconCandidate(tag, rel, resolved),
      });
    }
  }

  return uniqueCandidateUrls(
    candidates
      .sort((left, right) => left.score - right.score)
      .map((item) => item.url),
  );
}

async function extractManifestCandidates(html: string, pageUrl: string) {
  const manifestUrl = extractManifestUrl(html, pageUrl);

  if (!manifestUrl) {
    return [];
  }

  try {
    const response = await fetch(manifestUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("json") && !manifestUrl.endsWith(".webmanifest")) {
      return [];
    }

    const manifest = (await response.json()) as {
      icons?: Array<{ src?: string; sizes?: string; type?: string }>;
    };

    return uniqueCandidateUrls(
      (manifest.icons ?? [])
        .map((icon) => ({
          url: icon.src ? resolveHtmlAssetUrl(icon.src, response.url) : null,
          score: scoreManifestIconCandidate(icon.sizes ?? "", icon.type ?? ""),
        }))
        .filter((item): item is { url: string; score: number } => Boolean(item.url))
        .sort((left, right) => left.score - right.score)
        .map((item) => item.url),
    );
  } catch {
    return [];
  }
}

function extractManifestUrl(html: string, pageUrl: string) {
  const linkTagPattern = /<link\b[^>]*?>/gi;

  for (const tag of html.match(linkTagPattern) ?? []) {
    const rel = readHtmlAttribute(tag, "rel")?.toLowerCase() ?? "";

    if (!rel.includes("manifest")) {
      continue;
    }

    const href = readHtmlAttribute(tag, "href");

    if (!href) {
      continue;
    }

    return resolveHtmlAssetUrl(href, pageUrl);
  }

  return null;
}

function extractCommonLogoCandidates(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    return [
      "/favicon.ico",
      "/favicon-32x32.png",
      "/favicon-16x16.png",
      "/apple-touch-icon.png",
      "/android-chrome-192x192.png",
      "/android-chrome-512x512.png",
    ].map((path) => new URL(path, url.origin).toString());
  } catch {
    return [];
  }
}

function extractOpenGraphImageCandidates(html: string, pageUrl: string) {
  const candidates: string[] = [];
  const metaTagPattern = /<meta\b[^>]*?>/gi;

  for (const tag of html.match(metaTagPattern) ?? []) {
    const property = readHtmlAttribute(tag, "property")?.toLowerCase() ?? "";
    const name = readHtmlAttribute(tag, "name")?.toLowerCase() ?? "";

    if (property !== "og:image" && property !== "og:image:url" && name !== "twitter:image") {
      continue;
    }

    const content = readHtmlAttribute(tag, "content");

    if (!content) {
      continue;
    }

    const resolved = resolveHtmlAssetUrl(content, pageUrl);

    if (resolved) {
      candidates.push(resolved);
    }
  }

  return uniqueCandidateUrls(candidates);
}

function readHtmlAttribute(tag: string, attributeName: string) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);

  if (!match) {
    return null;
  }

  return match[2] ?? match[3] ?? match[4] ?? null;
}

function resolveHtmlAssetUrl(value: string, pageUrl: string) {
  const normalized = value.trim();

  if (!normalized || normalized.startsWith("data:")) {
    return null;
  }

  try {
    return new URL(normalized, pageUrl).toString();
  } catch {
    return null;
  }
}

async function fetchBookmarkLogoAsDataUrl(value: string) {
  try {
    const response = await fetch(value, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const contentTypeHeader = response.headers.get("content-type") ?? "";
    const contentType = normalizeLogoContentType(contentTypeHeader, value);

    if (!contentType || !contentType.startsWith("image/")) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > 256 * 1024) {
      return null;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function normalizeOptionalBookmarkLogoOverrideUrl(value: string | null | undefined, pageUrl: string) {
  if (!value) {
    return null;
  }

  return normalizeBookmarkUrlLike(value, pageUrl);
}

function normalizeBookmarkUrlLike(value: string, baseUrl?: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return baseUrl ? new URL(trimmed, baseUrl).toString() : new URL(trimmed).toString();
  } catch {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      return baseUrl ? new URL(withProtocol, baseUrl).toString() : new URL(withProtocol).toString();
    } catch {
      return null;
    }
  }
}

function scoreIconCandidate(tag: string, rel: string, url: string) {
  const sizes = readHtmlAttribute(tag, "sizes");
  const type = readHtmlAttribute(tag, "type") ?? inferMimeTypeFromUrl(url);
  let score = scoreManifestIconCandidate(sizes ?? "", type ?? "");

  if (rel.includes("apple-touch-icon")) {
    score += 8;
  }

  if (rel === "icon") {
    score -= 2;
  }

  return score;
}

function scoreManifestIconCandidate(sizes: string, type: string) {
  return scoreSizes(sizes) + scoreMimeType(type);
}

function scoreSizes(sizes: string) {
  const normalized = sizes.trim().toLowerCase();

  if (!normalized || normalized === "any") {
    return 40;
  }

  const [first] = normalized.split(/\s+/);
  const match = first.match(/^(\d+)x(\d+)$/);

  if (!match) {
    return 40;
  }

  const width = Number.parseInt(match[1] ?? "", 10);
  const height = Number.parseInt(match[2] ?? "", 10);
  const area = width * height;

  if (area >= 180 * 180 && area <= 512 * 512) {
    return 0;
  }

  if (area >= 48 * 48) {
    return 8;
  }

  if (area >= 32 * 32) {
    return 14;
  }

  return 24;
}

function scoreMimeType(value: string) {
  const type = value.toLowerCase();

  if (type.includes("png") || type.includes("webp")) {
    return 0;
  }

  if (type.includes("svg")) {
    return 4;
  }

  if (type.includes("x-icon") || type.includes("ico")) {
    return 8;
  }

  if (type.startsWith("image/")) {
    return 12;
  }

  return 20;
}

function normalizeLogoContentType(value: string, url: string) {
  const normalized = value.split(";")[0]?.trim().toLowerCase();

  if (normalized?.startsWith("image/")) {
    return normalized === "image/vnd.microsoft.icon" ? "image/x-icon" : normalized;
  }

  return inferMimeTypeFromUrl(url);
}

function inferMimeTypeFromUrl(value: string) {
  try {
    const pathname = new URL(value).pathname.toLowerCase();

    if (pathname.endsWith(".png")) {
      return "image/png";
    }

    if (pathname.endsWith(".svg")) {
      return "image/svg+xml";
    }

    if (pathname.endsWith(".webp")) {
      return "image/webp";
    }

    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
      return "image/jpeg";
    }

    if (pathname.endsWith(".gif")) {
      return "image/gif";
    }

    if (pathname.endsWith(".ico")) {
      return "image/x-icon";
    }
  } catch {
    return null;
  }

  return null;
}

function uniqueCandidateUrls(values: string[]) {
  return Array.from(new Set(values));
}

export function parseBookmarkTags(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function formatBookmarkTags(tags: string[]) {
  return tags.join(", ");
}
