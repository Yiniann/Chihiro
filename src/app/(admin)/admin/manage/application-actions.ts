"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth";
import {
  approveFriendLinkApplication,
  deleteFriendLinkApplication,
  holdFriendLinkApplication,
  rejectFriendLinkApplication,
} from "@/server/repositories/friend-link-applications";

export async function approveFriendLinkApplicationAction(formData: FormData) {
  await requireAdminSession();
  await approveFriendLinkApplication(getApplicationId(formData));
  revalidateManageSurfaces();
}

export async function rejectFriendLinkApplicationAction(formData: FormData) {
  await requireAdminSession();
  await rejectFriendLinkApplication(getApplicationId(formData));
  revalidateManageSurfaces();
}

export async function holdFriendLinkApplicationAction(formData: FormData) {
  await requireAdminSession();
  await holdFriendLinkApplication(getApplicationId(formData));
  revalidateManageSurfaces();
}

export async function deleteFriendLinkApplicationAction(formData: FormData) {
  await requireAdminSession();
  await deleteFriendLinkApplication(getApplicationId(formData));
  revalidateManageSurfaces();
}

function revalidateManageSurfaces() {
  revalidatePath("/friends");
  revalidatePath("/admin/friends");
}

function getApplicationId(formData: FormData) {
  const value = formData.get("id");

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("缺少有效的申请编号。");
  }

  return Number(value);
}
