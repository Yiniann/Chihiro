"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isSupportedAccountLinkProvider } from "@/lib/account-linking";
import { isOwnerAuthenticated } from "@/server/auth";
import { auth } from "@/server/public-auth";
import {
  deleteUser,
  findUserRole,
  getUserAuthMethods,
  unlinkUserProviderAccount,
  updateUserRole,
} from "@/server/repositories/users";

export async function setUserRoleAction(formData: FormData) {
  if (!(await isOwnerAuthenticated())) {
    throw new Error("只有 Owner 才能修改用户权限。");
  }

  const userId = formData.get("userId");
  const role = formData.get("role");

  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("缺少用户 ID。");
  }

  if (role !== UserRole.USER && role !== UserRole.ADMIN) {
    throw new Error("用户角色无效。");
  }

  const targetUser = await findUserRole(userId);

  if (!targetUser) {
    throw new Error("用户不存在。");
  }

  if (targetUser.role === UserRole.OWNER) {
    throw new Error("Owner 不能被降级。");
  }

  await updateUserRole(userId, role);
  revalidatePath("/admin/settings/users");
}

export async function unlinkOwnerProviderAction(formData: FormData) {
  if (!(await isOwnerAuthenticated())) {
    throw new Error("只有 Owner 才能修改绑定方式。");
  }

  const provider = formData.get("provider");

  if (typeof provider !== "string" || !isSupportedAccountLinkProvider(provider)) {
    throw new Error("登录方式无效。");
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  if (!currentUserId) {
    throw new Error("当前登录状态无效。");
  }

  const authMethods = await getUserAuthMethods(currentUserId);

  if (!authMethods) {
    throw new Error("当前帐号不存在。");
  }

  if (!authMethods.providers.includes(provider)) {
    throw new Error("当前帐号未绑定该登录方式。");
  }

  if (!authMethods.hasPasswordLogin && authMethods.providers.length <= 1) {
    throw new Error("至少保留一种可用登录方式。");
  }

  await unlinkUserProviderAccount(currentUserId, provider);
  revalidatePath("/admin/settings/users");
}

export async function deleteUserAction(formData: FormData) {
  if (!(await isOwnerAuthenticated())) {
    throw new Error("只有 Owner 才能删除用户。");
  }

  const userId = formData.get("userId");

  if (typeof userId !== "string" || !userId.trim()) {
    throw new Error("缺少用户 ID。");
  }

  const targetUser = await findUserRole(userId);

  if (!targetUser) {
    throw new Error("用户不存在。");
  }

  if (targetUser.role === UserRole.OWNER) {
    throw new Error("Owner 不能被删除。");
  }

  await deleteUser(userId);
  revalidatePath("/admin/settings/users");
}
