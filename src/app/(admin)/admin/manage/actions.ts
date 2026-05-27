"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth";
import {
  createApprovedFriendLinkApplication,
} from "@/server/repositories/friend-link-applications";
import { deleteFriendLinkById, updateFriendLink } from "@/server/repositories/friend-links";

export async function createFriendLinkAction(formData: FormData) {
  await requireAdminSession();

  try {
    await createApprovedFriendLinkApplication(readFriendLinkCreateInput(formData));
  } catch (error) {
    redirectToManageWithMessage(
      "error",
      error instanceof Error ? error.message : "创建友链时出错了。",
    );
  }

  revalidateFriendLinkSurfaces();
  redirectToManageWithMessage("notice", "友链已创建。");
}

export async function saveFriendLinkAction(formData: FormData) {
  await requireAdminSession();

  try {
    await updateFriendLink({
      id: getRequiredId(formData, "id"),
      ...readFriendLinkUpdateInput(formData),
    });
  } catch (error) {
    redirectToManageWithMessage(
      "error",
      error instanceof Error ? error.message : "保存友链时出错了。",
    );
  }

  revalidateFriendLinkSurfaces();
  redirectToManageWithMessage("notice", "友链已更新。");
}

export async function deleteFriendLinkAction(formData: FormData) {
  await requireAdminSession();

  try {
    await deleteFriendLinkById(getRequiredId(formData, "id"));
  } catch (error) {
    redirectToManageWithMessage(
      "error",
      error instanceof Error ? error.message : "删除友链时出错了。",
    );
  }

  revalidateFriendLinkSurfaces();
  redirectToManageWithMessage("notice", "友链已删除。");
}

function revalidateFriendLinkSurfaces() {
  revalidatePath("/friends");
  revalidatePath("/admin");
  revalidatePath("/admin/friends");
}

function redirectToManageWithMessage(key: "notice" | "error", message: string) {
  redirect(`/admin/friends?${key}=${encodeURIComponent(message)}`);
}

function readFriendLinkCreateInput(formData: FormData) {
  const nickname = getOptionalString(formData, "nickname");
  const siteName = getRequiredString(formData, "siteName");
  const siteUrl = normalizeUrl(getRequiredString(formData, "siteUrl"), "站点地址");
  const description = getOptionalString(formData, "description");
  const avatarUrl = getOptionalUrl(formData, "avatarUrl", "头像地址");
  const contactEmail = getOptionalEmail(formData, "contactEmail");
  const message = getOptionalString(formData, "message");
  const sortOrder = getInteger(formData, "sortOrder");
  const isVisible = formData.get("isVisible") === "1";

  return {
    nickname,
    siteName,
    siteUrl,
    description,
    avatarUrl,
    contactEmail,
    message,
    sortOrder,
    isVisible,
  };
}

function readFriendLinkUpdateInput(formData: FormData) {
  const name = getRequiredString(formData, "name");
  const url = normalizeUrl(getRequiredString(formData, "url"), "站点地址");
  const description = getOptionalString(formData, "description");
  const avatarUrl = getOptionalUrl(formData, "avatarUrl", "头像地址");
  const location = getOptionalString(formData, "location");
  const feedUrl = getOptionalUrl(formData, "feedUrl", "订阅地址");
  const email = getOptionalString(formData, "email");
  const sortOrder = getInteger(formData, "sortOrder");
  const isVisible = formData.get("isVisible") === "1";

  return {
    name,
    url,
    description,
    avatarUrl,
    location,
    feedUrl,
    email,
    sortOrder,
    isVisible,
  };
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`请填写${getFieldLabel(key)}。`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getOptionalEmail(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("请填写有效邮箱。");
  }

  return value.toLowerCase();
}

function getOptionalUrl(formData: FormData, key: string, label: string) {
  const value = getOptionalString(formData, key);
  return value ? normalizeUrl(value, label) : null;
}

function getInteger(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${getFieldLabel(key)}需要是整数。`);
  }

  return parsed;
}

function getRequiredId(formData: FormData, key: string) {
  const value = getRequiredString(formData, key);

  if (!/^\d+$/.test(value)) {
    throw new Error("缺少有效的友链编号。");
  }

  return Number(value);
}

function normalizeUrl(value: string, label: string) {
  const input = value.trim();
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(normalized);
    return url.toString();
  } catch {
    throw new Error(`${label}不是有效的链接。`);
  }
}

function getFieldLabel(key: string) {
  if (key === "name") {
    return "名称";
  }

  if (key === "url") {
    return "站点地址";
  }

  if (key === "sortOrder") {
    return "排序";
  }

  return key;
}
