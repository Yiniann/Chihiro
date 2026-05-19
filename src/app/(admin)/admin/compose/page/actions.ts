"use server";

import { ContentStatus, Prisma, StandalonePageNavGroup } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseStoredRichTextContent } from "@/lib/rich-text-content";
import { requireAdminSession } from "@/server/auth";
import {
  discardStandalonePageRevisionById,
  getStandalonePageByIdForAdmin,
  publishStandalonePageById,
  saveStandalonePage,
} from "@/server/repositories/standalone-pages";

const RESERVED_STANDALONE_PAGE_SLUGS = new Set([
  "admin",
  "api",
  "archives",
  "auth",
  "bookmarks",
  "comments",
  "friends",
  "install",
  "media",
  "more",
  "posts",
  "projects",
  "reviews",
  "settings",
  "timeline",
  "updates",
]);

export type SaveStandalonePageEditorState = {
  error: string | null;
  redirectTo: string | null;
};

export async function saveStandalonePageAction(
  _previousState: SaveStandalonePageEditorState,
  formData: FormData,
): Promise<SaveStandalonePageEditorState> {
  await requireAdminSession();
  const intent = getOptionalString(formData, "intent") ?? "save";

  try {
    const currentStatus = getContentStatus(formData, "currentStatus");
    const title = getRequiredString(formData, "title");
    const slug = normalizeSlug(getRequiredString(formData, "slug"));
    const content = parseRichTextContent(formData);
    const contentHtml = getOptionalString(formData, "contentHtml");
    const standalonePageId = getOptionalStandalonePageId(formData, "standalonePageId");
    const publishedAtInput = getOptionalString(formData, "publishedAt");
    const publishedAt = publishedAtInput ? parsePublishedAtInput(publishedAtInput) : null;
    const navLabel = getOptionalString(formData, "navLabel");
    const navEyebrow = getOptionalString(formData, "navEyebrow");
    const navPlacement = getNavPlacement(formData, "navPlacement");
    const seoTitle = getOptionalString(formData, "seoTitle");
    const seoDescription = getOptionalString(formData, "seoDescription");

    const showInNav = navPlacement !== "none";
    const navGroup =
      navPlacement === "more"
        ? StandalonePageNavGroup.MORE
        : StandalonePageNavGroup.HOME;

    const page = await saveStandalonePage({
      id: standalonePageId ?? undefined,
      title,
      slug,
      content: content as unknown as Prisma.JsonValue,
      contentHtml,
      status: currentStatus,
      publishedAt,
      showInNav,
      navLabel,
      navEyebrow,
      navGroup,
      seoTitle,
      seoDescription,
    });

    if (intent === "publish") {
      const publishedPage = await publishStandalonePageById(page.id);
      revalidateStandalonePageSurface(page.slug);
      revalidateStandalonePageSurface(publishedPage.slug);
    }

    revalidatePath("/admin/pages");
    revalidatePath("/admin/pages/new");

    if (intent !== "publish" && typeof standalonePageId !== "number") {
      return {
        error: null,
        redirectTo: `/admin/pages/${encodeURIComponent(page.id)}`,
      };
    }
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return {
        error: "这个 slug 已经被占用了，请换一个。",
        redirectTo: null,
      };
    }

    return {
      error: error instanceof Error ? error.message : "保存独立页面时出错了。",
      redirectTo: null,
    };
  }

  if (intent === "publish") {
    redirect("/admin/pages");
  }

  return {
    error: null,
    redirectTo: null,
  };
}

export async function discardStandalonePageRevisionAction(formData: FormData) {
  await requireAdminSession();
  const standalonePageId = getRequiredStandalonePageId(formData, "standalonePageId");
  const currentPage = await getStandalonePageByIdForAdmin(standalonePageId);

  if (!currentPage) {
    throw new Error("页面不存在或已被删除。");
  }

  if (!currentPage.draftSnapshot) {
    throw new Error("这个页面没有可以删除的草稿。");
  }

  const restoredPage = await discardStandalonePageRevisionById(standalonePageId);

  revalidateStandalonePageSurface(currentPage.slug);
  revalidateStandalonePageSurface(restoredPage.slug);
  revalidatePath("/admin/pages");
  revalidatePath("/admin/pages/new");

  redirect(`/admin/pages/${encodeURIComponent(restoredPage.id)}`);
}

function revalidateStandalonePageSurface(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  revalidatePath("/more");
  revalidatePath("/sitemap.xml");
}

function getRequiredString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    throw new Error(`请填写 ${key}。`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getOptionalStandalonePageId(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("请填写有效的页面编号。");
  }

  return Number(value);
}

function getRequiredStandalonePageId(formData: FormData, key: string) {
  const value = getOptionalStandalonePageId(formData, key);

  if (value === null) {
    throw new Error(`请填写 ${key}。`);
  }

  return value;
}

function parseRichTextContent(formData: FormData) {
  const raw = getOptionalString(formData, "content");

  if (!raw) {
    return null;
  }

  const parsed = parseStoredRichTextContent(raw);

  if (parsed === raw) {
    return null;
  }

  return parsed;
}

function getContentStatus(formData: FormData, key: string): ContentStatus {
  const value = getOptionalString(formData, key);

  return value === ContentStatus.PUBLISHED ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;
}

function normalizeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("请填写有效的 slug。");
  }

  if (RESERVED_STANDALONE_PAGE_SLUGS.has(slug)) {
    throw new Error("这个 slug 已经被系统页面占用，请换一个。");
  }

  return slug;
}

function parsePublishedAtInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})$/);

  if (!match) {
    throw new Error("请填写有效的发布日期。");
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

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

function getNavPlacement(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (value === "more") {
    return "more";
  }

  if (value === "home") {
    return "home";
  }

  return "none";
}

function isUniqueSlugError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
