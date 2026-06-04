"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth";
import {
  createBookmarkCategory,
  deleteBookmarkCategoryById,
  getBookmarkCategoryByIdForAdmin,
  updateBookmarkCategoryById,
  type BookmarkCategoryItem,
} from "@/server/repositories/bookmark-categories";

export type SaveBookmarkCategoryEditorState = {
  error: string | null;
  redirectTo: string | null;
  createdCategory: BookmarkCategoryItem | null;
  nonce: number;
};

export async function createBookmarkCategoryAction(
  _previousState: SaveBookmarkCategoryEditorState,
  formData: FormData,
): Promise<SaveBookmarkCategoryEditorState> {
  await requireAdminSession();

  try {
    const category = await createBookmarkCategory({
      name: getRequiredString(formData, "name"),
      slug: normalizeSlug(getRequiredString(formData, "slug")),
      eyebrow: getOptionalString(formData, "eyebrow"),
      description: getOptionalString(formData, "description"),
      sortOrder: getOptionalNumber(formData, "sortOrder") ?? 0,
    });

    revalidateBookmarkCategorySurfaces(category.id);

    return {
      error: null,
      redirectTo: `/admin/bookmarks/categories/${category.id}`,
      createdCategory: category,
      nonce: Date.now(),
    };
  } catch (error) {
    return {
      error: isUniqueSlugError(error)
        ? "这个 slug 已经被占用了，请换一个。"
        : error instanceof Error
          ? error.message
          : "创建书签分类时出错了。",
      redirectTo: null,
      createdCategory: null,
      nonce: Date.now(),
    };
  }
}

export async function saveBookmarkCategoryAction(
  _previousState: SaveBookmarkCategoryEditorState,
  formData: FormData,
): Promise<SaveBookmarkCategoryEditorState> {
  await requireAdminSession();
  const id = getRequiredNumber(formData, "id");

  try {
    const current = await getBookmarkCategoryByIdForAdmin(id);

    if (!current) {
      return {
        error: "书签分类不存在。",
        redirectTo: null,
        createdCategory: null,
        nonce: Date.now(),
      };
    }

    await updateBookmarkCategoryById({
      id,
      name: getRequiredString(formData, "name"),
      slug: normalizeSlug(getRequiredString(formData, "slug")),
      eyebrow: getOptionalString(formData, "eyebrow"),
      description: getOptionalString(formData, "description"),
      sortOrder: getOptionalNumber(formData, "sortOrder") ?? 0,
    });

    revalidateBookmarkCategorySurfaces(id);
  } catch (error) {
    return {
      error: isUniqueSlugError(error)
        ? "这个 slug 已经被占用了，请换一个。"
        : error instanceof Error
          ? error.message
          : "保存书签分类时出错了。",
      redirectTo: null,
      createdCategory: null,
      nonce: Date.now(),
    };
  }

  return {
    error: null,
    redirectTo: "/admin/bookmarks/categories",
    createdCategory: null,
    nonce: Date.now(),
  };
}

export async function deleteBookmarkCategoryAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredNumber(formData, "id");
  const current = await getBookmarkCategoryByIdForAdmin(id);

  if (!current) {
    throw new Error("书签分类不存在。");
  }

  if (current.bookmarkCount > 0) {
    throw new Error("请先移走这个分类下的书签，再删除分类。");
  }

  await deleteBookmarkCategoryById(id);
  revalidateBookmarkCategorySurfaces(id);
  redirect("/admin/bookmarks/categories");
}

function revalidateBookmarkCategorySurfaces(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookmarks");
  revalidatePath("/admin/bookmarks/new");
  revalidatePath("/admin/bookmarks/categories");
  revalidatePath("/admin/bookmarks/categories/new");
  revalidatePath(`/admin/bookmarks/categories/${id}`);
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

function isUniqueSlugError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
