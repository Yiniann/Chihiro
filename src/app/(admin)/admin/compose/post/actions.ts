"use server";

import { ContentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPostPath } from "@/lib/routes";
import { parseStoredRichTextContent } from "@/lib/rich-text-content";
import { requireAdminSession } from "@/server/auth";
import {
  discardPostRevisionById,
  getPostByIdForAdmin,
  publishPostById,
  savePostDraft,
} from "@/server/repositories/posts";
import { siteConfig } from "@/lib/site";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

export type SavePostEditorState = {
  error: string | null;
  redirectTo: string | null;
  nonce: number;
};

export async function savePostDraftAction(
  _previousState: SavePostEditorState,
  formData: FormData,
): Promise<SavePostEditorState> {
  await requireAdminSession();
  const intent = getOptionalString(formData, "intent") ?? "save";

  try {
    const currentStatus = getContentStatus(formData, "currentStatus");
    const title = getRequiredString(formData, "title");
    const slugInput = getOptionalString(formData, "slug");
    const slug = slugInput ? normalizeSlug(slugInput) : null;
    const summary = getOptionalString(formData, "summary");
    const content = parseRichTextContent(formData);
    const contentHtml = getOptionalString(formData, "contentHtml");
    const categoryId = getOptionalNumber(formData, "categoryId");
    const publishedAtInput = getOptionalString(formData, "publishedAt");
    const publishedAt = publishedAtInput ? parsePublishedAtInput(publishedAtInput) : null;
    const commentsEnabled = getBoolean(formData, "commentsEnabled");
    const tagIds = formData
      .getAll("tagIds")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    const postId = getOptionalPostId(formData, "postId");
    const ownerProfile = await getOwnerDisplayProfile();
    const authorName = getOwnerDisplayName(ownerProfile, siteConfig.author);

    const post = await savePostDraft({
      id: postId ?? undefined,
      title,
      slug,
      summary,
      content: content as unknown as Prisma.JsonValue,
      contentHtml,
      status: currentStatus,
      categoryId,
      publishedAt,
      commentsEnabled,
      tagIds,
      authorName,
    });

    if (intent === "publish") {
      const publishedPost = await publishPostById(post.id);

      revalidatePostSurface(post.slug, post.category?.slug);
      revalidatePostSurface(publishedPost.slug, publishedPost.category?.slug);
    }

    revalidatePath("/admin/posts");
    revalidatePath("/admin/posts/new");

    if (intent !== "publish" && typeof postId !== "number") {
      return {
        error: null,
        redirectTo: `/admin/posts/${encodeURIComponent(post.id)}`,
        nonce: Date.now(),
      };
    }
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return {
        error: "这个 slug 已经被占用了，请换一个。",
        redirectTo: null,
        nonce: Date.now(),
      };
    }

    return {
      error: error instanceof Error ? error.message : "保存文章时出错了。",
      redirectTo: null,
      nonce: Date.now(),
    };
  }

  if (intent === "publish") {
    redirect("/admin/posts");
  }

  return {
    error: null,
    redirectTo: null,
    nonce: Date.now(),
  };
}

export async function discardPostRevisionAction(formData: FormData) {
  await requireAdminSession();
  const postId = getRequiredPostId(formData, "postId");
  const currentPost = await getPostByIdForAdmin(postId);

  if (!currentPost) {
    throw new Error("草稿不存在或已被删除。");
  }

  if (!currentPost.draftSnapshot) {
    throw new Error("这篇文章没有可以删除的草稿。");
  }

  const restoredPost = await discardPostRevisionById(postId);

  revalidatePostSurface(currentPost.slug, currentPost.category?.slug);
  revalidatePostSurface(restoredPost.slug, restoredPost.category?.slug);
  revalidatePath("/admin/posts");
  revalidatePath("/admin/posts/new");

  redirect(`/admin/posts/${encodeURIComponent(restoredPost.id)}`);
}

function getRequiredString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    throw new Error(`请填写 ${key}。`);
  }

  return value;
}

function getRequiredPostId(formData: FormData, key: string) {
  const value = getOptionalPostId(formData, key);

  if (value === null) {
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

function getOptionalPostId(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("请填写有效的文章编号。");
  }

  return Number(value);
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`请填写有效的 ${key}。`);
  }

  return Number(value);
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
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

  return slug;
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

function isUniqueSlugError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function revalidatePostSurface(slug: string, categorySlug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/tags");
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/posts");
  revalidatePath(getPostPath({ slug, categorySlug }));
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/feed");
  revalidatePath("/sitemap.xml");
}
