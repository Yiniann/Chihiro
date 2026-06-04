"use server";

import { BookmarkKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth";
import {
  createBookmark,
  deleteBookmarkById,
  getBookmarkByIdForAdmin,
  updateBookmark,
  type BookmarkItem,
} from "@/server/repositories/bookmarks";
import { normalizeBookmarkUrl, parseBookmarkTags } from "@/lib/bookmarks";
import { getBookmarkCategoryByIdForAdmin } from "@/server/repositories/bookmark-categories";

export type SaveBookmarkEditorState = {
  error: string | null;
  redirectTo: string | null;
  createdBookmark: BookmarkItem | null;
  nonce: number;
};

export async function createBookmarkAction(
  _previousState: SaveBookmarkEditorState,
  formData: FormData,
): Promise<SaveBookmarkEditorState> {
  await requireAdminSession();

  try {
    const bookmark = await createBookmark(await parseBookmarkFormData(formData));

    revalidateBookmarkSurfaces(bookmark.id);

    return {
      error: null,
      redirectTo: "/admin/bookmarks",
      createdBookmark: bookmark,
      nonce: Date.now(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "创建书签时出错了。",
      redirectTo: null,
      createdBookmark: null,
      nonce: Date.now(),
    };
  }
}

export async function saveBookmarkAction(
  _previousState: SaveBookmarkEditorState,
  formData: FormData,
): Promise<SaveBookmarkEditorState> {
  await requireAdminSession();
  const id = getRequiredNumber(formData, "id");

  try {
    const currentBookmark = await getBookmarkByIdForAdmin(id);

    if (!currentBookmark) {
      return {
        error: "书签不存在。",
        redirectTo: null,
        createdBookmark: null,
        nonce: Date.now(),
      };
    }

    await updateBookmark({
      id,
      ...(await parseBookmarkFormData(formData)),
    });

    revalidateBookmarkSurfaces(id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存书签时出错了。",
      redirectTo: null,
      createdBookmark: null,
      nonce: Date.now(),
    };
  }

  return {
    error: null,
    redirectTo: "/admin/bookmarks",
    createdBookmark: null,
    nonce: Date.now(),
  };
}

export async function deleteBookmarkAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredNumber(formData, "id");
  const currentBookmark = await getBookmarkByIdForAdmin(id);

  if (!currentBookmark) {
    throw new Error("书签不存在。");
  }

  await deleteBookmarkById(id);
  revalidateBookmarkSurfaces(id);
  redirect("/admin/bookmarks");
}

export async function toggleBookmarkVisibilityAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredNumber(formData, "id");
  const currentBookmark = await getBookmarkByIdForAdmin(id);

  if (!currentBookmark) {
    throw new Error("书签不存在。");
  }

  await updateBookmark({
    id,
    title: currentBookmark.title,
    url: currentBookmark.url,
    summary: currentBookmark.summary,
    note: currentBookmark.note,
    categoryId: currentBookmark.category.id,
    kind: currentBookmark.kind,
    tags: currentBookmark.tags,
    sortOrder: currentBookmark.sortOrder,
    isVisible: !currentBookmark.isVisible,
    isFeatured: currentBookmark.isFeatured,
  });

  revalidateBookmarkSurfaces(id);
}

async function parseBookmarkFormData(formData: FormData) {
  return {
    title: getRequiredString(formData, "title"),
    url: normalizeBookmarkUrl(getRequiredString(formData, "url")),
    summary: getRequiredString(formData, "summary"),
    note: getOptionalString(formData, "note"),
    categoryId: await getBookmarkCategoryId(formData, "categoryId"),
    kind: getBookmarkKind(formData, "kind"),
    tags: parseBookmarkTags(getOptionalString(formData, "tags")),
    sortOrder: getOptionalNumber(formData, "sortOrder") ?? 0,
    isVisible: getBoolean(formData, "isVisible"),
    isFeatured: getBoolean(formData, "isFeatured"),
  };
}

function revalidateBookmarkSurfaces(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookmarks");
  revalidatePath("/admin/bookmarks/new");
  revalidatePath(`/admin/bookmarks/${id}`);
  revalidatePath("/bookmarks");
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

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`请填写有效的 ${key}。`);
  }

  return parsed;
}

function getRequiredNumber(formData: FormData, key: string) {
  const value = getOptionalNumber(formData, key);

  if (value === null) {
    throw new Error(`请填写 ${key}。`);
  }

  return value;
}

async function getBookmarkCategoryId(formData: FormData, key: string) {
  const value = getRequiredNumber(formData, key);
  const category = await getBookmarkCategoryByIdForAdmin(value);

  if (!category) {
    throw new Error("请选择有效的书签分类。");
  }

  return category.id;
}

function getBookmarkKind(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);

  if (
    value === BookmarkKind.DOCS ||
    value === BookmarkKind.ARTICLE ||
    value === BookmarkKind.TOOL ||
    value === BookmarkKind.COLLECTION
  ) {
    return value;
  }

  throw new Error("请选择有效的书签类型。");
}
