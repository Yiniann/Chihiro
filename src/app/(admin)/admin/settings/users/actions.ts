"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  MIN_ADMIN_USERNAME_LENGTH,
  normalizeAdminUsername,
} from "@/lib/admin-auth";
import { isSupportedAccountLinkProvider } from "@/lib/account-linking";
import { isOwnerAuthenticated } from "@/server/auth";
import { auth } from "@/server/public-auth";
import {
  getSocialLinkLabel,
  normalizeSocialLinkInput,
  SOCIAL_LINK_PLATFORM_ORDER,
  type SocialLink,
  type SocialLinkPlatform,
} from "@/lib/social-links";
import {
  deleteUser,
  findUserRole,
  getUserAuthMethods,
  unlinkUserProviderAccount,
  updateUserEmail,
  updateUserProfile,
  updateUserRole,
} from "@/server/repositories/users";

export type SaveOwnerSettingsState = {
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

export async function saveOwnerSettingsAction(
  _previousState: SaveOwnerSettingsState,
  formData: FormData,
): Promise<SaveOwnerSettingsState> {
  if (!(await isOwnerAuthenticated())) {
    return {
      error: "只有 Owner 才能修改资料。",
      success: null,
    };
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const usernameValue = formData.get("username");
  const nameValue = formData.get("name");
  const imageValue = formData.get("image");
  const socialLinkPlatforms = formData
    .getAll("socialLinkPlatform")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const socialLinkUrls = formData
    .getAll("socialLinkUrl")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const username =
    typeof usernameValue === "string" ? normalizeAdminUsername(usernameValue) : "";
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const imageInput = typeof imageValue === "string" ? imageValue.trim() : "";

  if (!currentUserId) {
    return {
      error: "当前登录状态无效。",
      success: null,
    };
  }

  if (!name) {
    return {
      error: "请输入名称。",
      success: null,
    };
  }

  if (!username) {
    return {
      error: "请输入用户名。",
      success: null,
    };
  }

  if (username.length < MIN_ADMIN_USERNAME_LENGTH) {
    return {
      error: `用户名至少需要 ${MIN_ADMIN_USERNAME_LENGTH} 个字符。`,
      success: null,
    };
  }

  let image: string | null = null;
  let githubUrl: string | null = null;
  const socialLinks: SocialLink[] = [];
  let email: string | null = null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (imageInput) {
    if (imageInput.startsWith("/") && !imageInput.startsWith("//")) {
      image = imageInput;
    } else {
      try {
        const url = new URL(imageInput);

        if (url.protocol === "http:" || url.protocol === "https:") {
          image = url.toString().replace(/\/$/, "");
        } else {
          return {
            error: "请填写有效头像地址。",
            success: null,
          };
        }
      } catch {
        return {
          error: "请填写有效头像地址。",
          success: null,
        };
      }
    }
  }

  for (let index = 0; index < Math.max(socialLinkPlatforms.length, socialLinkUrls.length); index += 1) {
    const platformValue = socialLinkPlatforms[index] ?? "";
    const input = socialLinkUrls[index] ?? "";

    if (!platformValue && !input) {
      continue;
    }

    if (!platformValue) {
      return {
        error: "请选择社交平台。",
        success: null,
      };
    }

    if (!SOCIAL_LINK_PLATFORM_ORDER.includes(platformValue as SocialLinkPlatform)) {
      return {
        error: "社交平台无效。",
        success: null,
      };
    }

    if (!input) {
      continue;
    }

    const platform = platformValue as SocialLinkPlatform;
    const normalized = normalizeSocialLinkInput(platform, input);

    if (!normalized) {
      return {
        error: `请填写有效的 ${getSocialLinkLabel(platform)} 链接。`,
        success: null,
      };
    }

    if (socialLinks.some((link) => link.platform === platform)) {
      return {
        error: `${getSocialLinkLabel(platform)} 只能保留一条。`,
        success: null,
      };
    }

    if (platform === "email") {
      const normalizedEmail = normalized.replace(/^mailto:/i, "").trim().toLowerCase();

      if (!emailPattern.test(normalizedEmail)) {
        return {
          error: "请输入有效邮箱。",
          success: null,
        };
      }

      email = normalizedEmail;
    }

    if (platform === "github") {
      githubUrl = normalized;
    }

    socialLinks.push({
      platform,
      label: getSocialLinkLabel(platform),
      href: normalized,
    });
  }

  try {
    await updateUserEmail(currentUserId, email || null);

    await updateUserProfile(currentUserId, {
      username,
      name,
      image,
      githubUrl,
      socialLinks,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");

      if (target.includes("username")) {
        return {
          error: "这个用户名已经被使用。",
          success: null,
        };
      }

      if (target.includes("email")) {
        return {
          error: "这个邮箱已经被其他帐号使用。",
          success: null,
        };
      }
    }

    throw error;
  }
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/message");
  revalidatePath("/posts");
  revalidatePath("/updates");
  revalidatePath("/timeline");
  revalidatePath("/more");
  revalidatePath("/admin");
  revalidatePath("/admin/settings/users");

  return {
    error: null,
    success: "设置已保存。",
  };
}
