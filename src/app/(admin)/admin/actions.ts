"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPostPath } from "@/lib/routes";
import { requireAdminSession } from "@/server/auth";
import {
  deletePostById,
  movePostToTrashById,
  publishPostById,
  restorePostFromTrashById,
  unpublishPostById,
} from "@/server/repositories/posts";
import {
  deleteUpdateById,
  moveUpdateToTrashById,
  publishUpdateById,
  restoreUpdateFromTrashById,
  unpublishUpdateById,
} from "@/server/repositories/updates";
import {
  deleteStandalonePageById,
  moveStandalonePageToTrashById,
  publishStandalonePageById,
  restoreStandalonePageFromTrashById,
  unpublishStandalonePageById,
} from "@/server/repositories/standalone-pages";

export async function publishPostAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredPostId(formData, "id");
  const post = await publishPostById(id);

  revalidatePostSurface(post.slug, post.category?.slug);
  redirect("/admin/posts");
}

export async function publishPostsBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一篇文章。");

  for (const id of ids) {
    const post = await publishPostById(id);
    revalidatePostSurface(post.slug, post.category?.slug);
  }

  redirect("/admin/posts");
}

export async function unpublishPostAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredPostId(formData, "id");
  const post = await unpublishPostById(id);

  revalidatePostSurface(post.slug, post.category?.slug);
  redirect("/admin/posts");
}

export async function unpublishPostsBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一篇文章。");

  for (const id of ids) {
    const post = await unpublishPostById(id);
    revalidatePostSurface(post.slug, post.category?.slug);
  }

  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredPostId(formData, "id");
  const post = await movePostToTrashById(id);

  revalidatePostSurface(post.slug, post.category?.slug);
  redirect("/admin/posts");
}

export async function restorePostAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredPostId(formData, "id");
  const post = await restorePostFromTrashById(id);

  revalidatePostSurface(post.slug, post.category?.slug);
  redirect("/admin/trash");
}

export async function permanentlyDeletePostAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredPostId(formData, "id");
  const post = await deletePostById(id);

  revalidatePostSurface(post.slug, post.category?.slug);
  redirect("/admin/trash");
}

export async function restoreTrashItemAction(formData: FormData) {
  await requireAdminSession();
  const entry = getRequiredTrashEntry(formData, "item");

  if (entry.kind === "post") {
    const post = await restorePostFromTrashById(entry.id);
    revalidatePostSurface(post.slug, post.category?.slug);
  } else if (entry.kind === "update") {
    await restoreUpdateFromTrashById(entry.id);
    revalidateUpdateSurface();
  } else {
    const page = await restoreStandalonePageFromTrashById(entry.id);
    revalidateStandalonePageSurface(page.slug);
  }

  redirect("/admin/trash");
}

export async function restoreTrashItemsBulkAction(formData: FormData) {
  await requireAdminSession();
  const entries = getRequiredTrashEntries(formData, "items", "请至少选择一项内容。");

  for (const entry of entries) {
    if (entry.kind === "post") {
      const post = await restorePostFromTrashById(entry.id);
      revalidatePostSurface(post.slug, post.category?.slug);
    } else if (entry.kind === "update") {
      await restoreUpdateFromTrashById(entry.id);
      revalidateUpdateSurface();
    } else {
      const page = await restoreStandalonePageFromTrashById(entry.id);
      revalidateStandalonePageSurface(page.slug);
    }
  }

  redirect("/admin/trash");
}

export async function permanentlyDeleteTrashItemAction(formData: FormData) {
  await requireAdminSession();
  const entry = getRequiredTrashEntry(formData, "item");

  if (entry.kind === "post") {
    const post = await deletePostById(entry.id);
    revalidatePostSurface(post.slug, post.category?.slug);
  } else if (entry.kind === "update") {
    await deleteUpdateById(entry.id);
    revalidateUpdateSurface();
  } else {
    const page = await deleteStandalonePageById(entry.id);
    revalidateStandalonePageSurface(page.slug);
  }

  redirect("/admin/trash");
}

export async function permanentlyDeleteTrashItemsBulkAction(formData: FormData) {
  await requireAdminSession();
  const entries = getRequiredTrashEntries(formData, "items", "请至少选择一项内容。");

  for (const entry of entries) {
    if (entry.kind === "post") {
      const post = await deletePostById(entry.id);
      revalidatePostSurface(post.slug, post.category?.slug);
    } else if (entry.kind === "update") {
      await deleteUpdateById(entry.id);
      revalidateUpdateSurface();
    } else {
      const page = await deleteStandalonePageById(entry.id);
      revalidateStandalonePageSurface(page.slug);
    }
  }

  redirect("/admin/trash");
}

export async function deletePostsBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一篇文章。");

  for (const id of ids) {
    const post = await movePostToTrashById(id);
    revalidatePostSurface(post.slug, post.category?.slug);
  }

  redirect("/admin/posts");
}

export async function publishUpdateAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  await publishUpdateById(id);

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function publishUpdatesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一条动态。");

  for (const id of ids) {
    await publishUpdateById(id);
  }

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function unpublishUpdateAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  await unpublishUpdateById(id);

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function unpublishUpdatesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一条动态。");

  for (const id of ids) {
    await unpublishUpdateById(id);
  }

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function deleteUpdateAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  await moveUpdateToTrashById(id);

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function restoreUpdateAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  await restoreUpdateFromTrashById(id);

  revalidateUpdateSurface();
  redirect("/admin/trash");
}

export async function permanentlyDeleteUpdateAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  await deleteUpdateById(id);

  revalidateUpdateSurface();
  redirect("/admin/trash");
}

export async function deleteUpdatesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一条动态。");

  for (const id of ids) {
    await moveUpdateToTrashById(id);
  }

  revalidateUpdateSurface();
  redirect("/admin/updates");
}

export async function publishStandalonePageAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  const page = await publishStandalonePageById(id);

  revalidateStandalonePageSurface(page.slug);
  redirect("/admin/pages");
}

export async function publishStandalonePagesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一个独立页面。");

  for (const id of ids) {
    const page = await publishStandalonePageById(id);
    revalidateStandalonePageSurface(page.slug);
  }

  redirect("/admin/pages");
}

export async function unpublishStandalonePageAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  const page = await unpublishStandalonePageById(id);

  revalidateStandalonePageSurface(page.slug);
  redirect("/admin/pages");
}

export async function unpublishStandalonePagesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一个独立页面。");

  for (const id of ids) {
    const page = await unpublishStandalonePageById(id);
    revalidateStandalonePageSurface(page.slug);
  }

  redirect("/admin/pages");
}

export async function deleteStandalonePageAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  const page = await moveStandalonePageToTrashById(id);

  revalidateStandalonePageSurface(page.slug);
  redirect("/admin/pages");
}

export async function restoreStandalonePageAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  const page = await restoreStandalonePageFromTrashById(id);

  revalidateStandalonePageSurface(page.slug);
  redirect("/admin/trash");
}

export async function permanentlyDeleteStandalonePageAction(formData: FormData) {
  await requireAdminSession();
  const id = getRequiredId(formData, "id");
  const page = await deleteStandalonePageById(id);

  revalidateStandalonePageSurface(page.slug);
  redirect("/admin/trash");
}

export async function deleteStandalonePagesBulkAction(formData: FormData) {
  await requireAdminSession();
  const ids = getRequiredIds(formData, "ids", "请至少选择一个独立页面。");

  for (const id of ids) {
    const page = await moveStandalonePageToTrashById(id);
    revalidateStandalonePageSurface(page.slug);
  }

  redirect("/admin/pages");
}

function revalidatePostSurface(slug: string, categorySlug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/trash");
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

function revalidateUpdateSurface() {
  revalidatePath("/admin");
  revalidatePath("/admin/updates");
  revalidatePath("/admin/trash");
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/updates");
  revalidatePath("/feed");
  revalidatePath("/sitemap.xml");
}

function revalidateStandalonePageSurface(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pages");
  revalidatePath("/admin/trash");
  revalidatePath("/");
  revalidatePath("/more");
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing form field: ${key}`);
  }

  return value;
}

function getRequiredPostId(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);

  if (!/^\d+$/.test(value)) {
    throw new Error("请填写有效的文章编号。");
  }

  return Number(value);
}

function getRequiredId(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);

  if (!/^\d+$/.test(value)) {
    throw new Error("请填写有效的编号。");
  }

  return Number(value);
}

function getRequiredIds(formData: FormData, key: string, message: string) {
  const values = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && /^\d+$/.test(value))
    .map((value) => Number(value));

  if (values.length === 0) {
    throw new Error(message);
  }

  return Array.from(new Set(values));
}

function getRequiredTrashEntry(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);
  const entry = parseTrashEntry(value);

  if (!entry) {
    throw new Error("请填写有效的回收站内容。");
  }

  return entry;
}

function getRequiredTrashEntries(formData: FormData, key: string, message: string) {
  const entries = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => parseTrashEntry(value))
    .filter((value): value is NonNullable<ReturnType<typeof parseTrashEntry>> => Boolean(value));

  if (entries.length === 0) {
    throw new Error(message);
  }

  return Array.from(new Map(entries.map((entry) => [`${entry.kind}:${entry.id}`, entry])).values());
}

function parseTrashEntry(value: string) {
  const match = value.match(/^(post|update|page):(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    kind: match[1] as "post" | "update" | "page",
    id: Number(match[2]),
  };
}
