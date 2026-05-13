"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isOwnerAuthenticated } from "@/server/auth";
import { findUserRole, updateUserRole } from "@/server/repositories/users";

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
