"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isSupportedAccountLinkProvider } from "@/lib/account-linking";
import { isOwnerAuthenticated } from "@/server/auth";
import { hashPassword, verifyPasswordHash } from "@/server/passwords";
import { auth } from "@/server/public-auth";
import {
  deleteUser,
  findUserSecurityProfileById,
  findUserRole,
  getUserAuthMethods,
  unlinkUserProviderAccount,
  updateUserEmail,
  updateUserPasswordHash,
  updateUserRole,
} from "@/server/repositories/users";

export type SaveOwnerEmailState = {
  error: string | null;
  success: string | null;
};

export type SaveOwnerPasswordState = {
  error: string | null;
  success: string | null;
};

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

export async function saveOwnerEmailAction(
  _previousState: SaveOwnerEmailState,
  formData: FormData,
): Promise<SaveOwnerEmailState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改邮箱。",
      success: null,
    };
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const passwordValue = formData.get("password");
  const emailValue = formData.get("email");
  const password = typeof passwordValue === "string" ? passwordValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!currentUserId) {
    return {
      error: "当前登录状态无效。",
      success: null,
    };
  }

  if (!password) {
    return {
      error: "请输入当前密码。",
      success: null,
    };
  }

  if (!email) {
    return {
      error: "请输入邮箱。",
      success: null,
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      error: "请输入有效邮箱。",
      success: null,
    };
  }

  const user = await findUserSecurityProfileById(currentUserId);

  if (!user?.passwordHash) {
    return {
      error: "当前帐号不支持本地密码校验。",
      success: null,
    };
  }

  const passwordMatches = await verifyPasswordHash(password, user.passwordHash);

  if (!passwordMatches) {
    return {
      error: "当前密码不正确。",
      success: null,
    };
  }

  try {
    await updateUserEmail(currentUserId, email);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "这个邮箱已经被其他帐号使用。",
        success: null,
      };
    }

    throw error;
  }

  revalidatePath("/admin/settings/users");

  return {
    error: null,
    success: "邮箱已保存。",
  };
}

export async function saveOwnerPasswordAction(
  _previousState: SaveOwnerPasswordState,
  formData: FormData,
): Promise<SaveOwnerPasswordState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改密码。",
      success: null,
    };
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const currentPasswordValue = formData.get("currentPassword");
  const nextPasswordValue = formData.get("nextPassword");
  const confirmPasswordValue = formData.get("confirmPassword");
  const currentPassword =
    typeof currentPasswordValue === "string"
      ? currentPasswordValue.trim()
      : "";
  const nextPassword =
    typeof nextPasswordValue === "string"
      ? nextPasswordValue.trim()
      : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string"
      ? confirmPasswordValue.trim()
      : "";

  if (!currentUserId) {
    return {
      error: "当前登录状态无效。",
      success: null,
    };
  }

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return {
      error: "请填写完整密码信息。",
      success: null,
    };
  }

  if (nextPassword.length < 8) {
    return {
      error: "新密码至少需要 8 位。",
      success: null,
    };
  }

  if (nextPassword !== confirmPassword) {
    return {
      error: "两次输入的新密码不一致。",
      success: null,
    };
  }

  const user = await findUserSecurityProfileById(currentUserId);

  if (!user?.passwordHash) {
    return {
      error: "当前帐号不支持本地密码校验。",
      success: null,
    };
  }

  const currentPasswordMatches = await verifyPasswordHash(currentPassword, user.passwordHash);

  if (!currentPasswordMatches) {
    return {
      error: "当前密码不正确。",
      success: null,
    };
  }

  const nextPasswordMatchesCurrent = await verifyPasswordHash(nextPassword, user.passwordHash);

  if (nextPasswordMatchesCurrent) {
    return {
      error: "新密码不能和当前密码相同。",
      success: null,
    };
  }

  await updateUserPasswordHash(currentUserId, await hashPassword(nextPassword));
  revalidatePath("/admin/settings/users");

  return {
    error: null,
    success: "密码已更新。",
  };
}
