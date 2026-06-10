"use server";

import { ContentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getParagraphsFromContent } from "@/lib/content";
import { parseStoredRichTextContent } from "@/lib/rich-text-content";
import {
  isUpdateKindValue,
  type UpdateKindValue,
  type UpdateMetadata,
} from "@/lib/update-kind";
import { requireAdminSession } from "@/server/auth";
import { notifySubscribersAboutPublishedUpdate } from "@/server/mail/update-subscription-notifier";
import {
  discardUpdateRevisionById,
  publishUpdateById,
  getUpdateByIdForAdmin,
  saveUpdate,
} from "@/server/repositories/updates";
import { siteConfig } from "@/lib/site";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

export type SaveUpdateEditorState = {
  error: string | null;
  redirectTo: string | null;
  nonce: number;
};

export async function saveUpdateAction(
  _previousState: SaveUpdateEditorState,
  formData: FormData,
): Promise<SaveUpdateEditorState> {
  await requireAdminSession();
  const intent = getOptionalString(formData, "intent") ?? "save";
  const currentStatus = getContentStatus(formData, "currentStatus");

  const publishedAtInput = getOptionalString(formData, "publishedAt");
  const publishedAt = publishedAtInput ? parsePublishedAtInput(publishedAtInput) : null;
  const updateId = getOptionalUpdateId(formData, "updateId");
  const ownerProfile = await getOwnerDisplayProfile();
  const fallbackAuthorName = getOwnerDisplayName(ownerProfile, siteConfig.author);
  const kind = getUpdateKind(formData, "updateKind");
  const content = parseRichTextContent(formData);
  const contentHtml = getOptionalString(formData, "contentHtml");
  const metadata = parseUpdateMetadataForm(formData, kind);

  try {
    if (kind === "NOTE" && !hasMeaningfulUpdateContent(content)) {
      throw new Error("普通动态需要填写内容。");
    }

    const update = await saveUpdate({
      id: updateId ?? undefined,
      kind,
      content: content as unknown as Prisma.JsonValue,
      contentHtml,
      metadata,
      authorName: fallbackAuthorName,
      status: currentStatus,
      publishedAt,
    });

    if (intent === "publish") {
      const publishedUpdate = await publishUpdateById(update.id);
      await notifySubscribersAboutPublishedUpdate(publishedUpdate);

      revalidateUpdateSurface();
    }

    revalidatePath("/admin/updates");
    revalidatePath("/admin/updates/new");
    revalidatePath(`/admin/updates/${encodeURIComponent(update.id)}`);

    if (intent !== "publish") {
      return {
        error: null,
        redirectTo: `/admin/updates/${encodeURIComponent(update.id)}`,
        nonce: Date.now(),
      };
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "保存动态时遇到了重复值，请稍后再试。",
        redirectTo: null,
        nonce: Date.now(),
      };
    }

    return {
      error: error instanceof Error ? error.message : "保存动态时出错了。",
      redirectTo: null,
      nonce: Date.now(),
    };
  }

  if (intent === "publish") {
    redirect("/admin/updates");
  }

  return {
    error: null,
    redirectTo: null,
    nonce: Date.now(),
  };
}

export async function discardUpdateRevisionAction(formData: FormData) {
  await requireAdminSession();
  const updateId = getRequiredUpdateId(formData, "updateId");
  const currentUpdate = await getUpdateByIdForAdmin(updateId);

  if (!currentUpdate) {
    throw new Error("草稿不存在或已被删除。");
  }

  if (!currentUpdate.draftSnapshot) {
    throw new Error("这条动态没有可以删除的草稿。");
  }

  const restoredUpdate = await discardUpdateRevisionById(updateId);

  revalidateUpdateSurface();
  revalidatePath("/admin/updates");
  revalidatePath("/admin/updates/new");

  redirect(`/admin/updates/${encodeURIComponent(restoredUpdate.id)}`);
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getOptionalUpdateId(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("请填写有效的动态编号。");
  }

  return Number(value);
}

function getRequiredUpdateId(formData: FormData, key: string) {
  const value = getOptionalUpdateId(formData, key);

  if (value === null) {
    throw new Error(`请填写 ${key}。`);
  }

  return value;
}

function getContentStatus(formData: FormData, key: string): ContentStatus {
  const value = getOptionalString(formData, key);

  return value === ContentStatus.PUBLISHED ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;
}

function getUpdateKind(formData: FormData, key: string): UpdateKindValue {
  const value = getOptionalString(formData, key);

  if (!value || !isUpdateKindValue(value)) {
    return "NOTE";
  }

  return value;
}

function parseRichTextContent(formData: FormData): Prisma.JsonValue | null {
  const raw = getOptionalString(formData, "content");

  if (!raw) {
    return null;
  }

  return parseStoredRichTextContent(raw) as Prisma.JsonValue;
}

function hasMeaningfulUpdateContent(content: Prisma.JsonValue | null) {
  if (!content) {
    return false;
  }

  return getParagraphsFromContent(content)
    .map((line) => line.trim())
    .some(Boolean);
}

function parsePublishedAtInput(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})$/,
  );

  if (!match) {
    throw new Error("请填写有效的发布日期。");
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute)
  ) {
    throw new Error("请填写有效的发布日期。");
  }

  return date;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function revalidateUpdateSurface() {
  revalidatePath("/admin");
  revalidatePath("/admin/updates");
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/updates");
  revalidatePath("/feed");
  revalidatePath("/sitemap.xml");
}

function parseUpdateMetadataForm(formData: FormData, kind: UpdateKindValue): UpdateMetadata {
  const serializedMetadata = getOptionalString(formData, "updateMetadataJson");

  if (serializedMetadata) {
    try {
      const parsed = JSON.parse(serializedMetadata) as UpdateMetadata;

      if (parsed && typeof parsed === "object" && "kind" in parsed && parsed.kind === kind) {
        return parsed;
      }
    } catch {
      // Fall through to field-based parsing when JSON payload is invalid.
    }
  }

  if (kind === "MOVIE") {
    return {
      kind,
      data: {
        format: getOptionalString(formData, "movieFormat"),
        tmdbId: getOptionalString(formData, "movieTmdbId"),
        seasonNumber: getOptionalString(formData, "movieSeasonNumber"),
        seasonName: getOptionalString(formData, "movieSeasonName"),
        episodeNumber: getOptionalString(formData, "movieEpisodeNumber"),
        episodeTitle: getOptionalString(formData, "movieEpisodeTitle"),
        title: getOptionalString(formData, "movieTitle") ?? "",
        originalTitle: getOptionalString(formData, "movieOriginalTitle"),
        year: getOptionalString(formData, "movieYear"),
        posterUrl: getOptionalString(formData, "moviePosterUrl"),
        director: getOptionalString(formData, "movieDirector"),
        genres: parseCsvField(formData, "movieGenres"),
        overview: getOptionalString(formData, "movieOverview"),
        rating: getOptionalString(formData, "movieRating"),
        sourceName: getOptionalString(formData, "movieSourceName"),
        sourceUrl: getOptionalString(formData, "movieSourceUrl"),
      },
    };
  }

  if (kind === "MUSIC") {
    return {
      kind,
      data: {
        format: getOptionalString(formData, "musicFormat"),
        title: getOptionalString(formData, "musicTitle") ?? "",
        artist: getOptionalString(formData, "musicArtist"),
        album: getOptionalString(formData, "musicAlbum"),
        releaseYear: getOptionalString(formData, "musicReleaseYear"),
        coverUrl: getOptionalString(formData, "musicCoverUrl"),
        genres: parseCsvField(formData, "musicGenres"),
        appleMusicId: getOptionalString(formData, "musicAppleMusicId"),
        appleMusicUrl: getOptionalString(formData, "musicAppleMusicUrl"),
        listeningNote: getOptionalString(formData, "musicListeningNote"),
      },
    };
  }

  if (kind === "OBJECT") {
    const slug = getOptionalString(formData, "objectSlug");

    return {
      kind,
      data: {
        title: getOptionalString(formData, "objectTitle") ?? "",
        slug,
        heroImage: getOptionalString(formData, "objectHeroImage"),
        brand: getOptionalString(formData, "objectBrand"),
        model: getOptionalString(formData, "objectModel"),
        category: getOptionalString(formData, "objectCategory"),
        summary: getOptionalString(formData, "objectSummary"),
        detailPath: slug ? `/updates/objects/${slug}` : null,
      },
    };
  }

  return {
    kind: "NOTE",
    data: null,
  };
}

function parseCsvField(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
