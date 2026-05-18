"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site";
import {
  MIN_ADMIN_PASSWORD_LENGTH,
  MIN_ADMIN_USERNAME_LENGTH,
  normalizeAdminUsername,
} from "@/lib/admin-auth";
import { signIn } from "@/server/public-auth";
import { isDatabaseUnavailableError } from "@/server/database-errors";
import { getInstallationState } from "@/server/installation";
import { hashPassword } from "@/server/passwords";
import { upsertSiteSettings } from "@/server/repositories/site";
import {
  countLocalAdminUsers,
  createOwnerUser,
} from "@/server/repositories/users";

export type InstallActionState = {
  error: string | null;
};

export async function initializeSiteAction(
  _previousState: InstallActionState,
  formData: FormData,
): Promise<InstallActionState> {
  const installationState = await getInstallationState();

  if (installationState.status === "missing_database") {
    return {
      error: "还没有配置 DATABASE_URL，请先把数据库连接串写入环境变量。",
    };
  }

  if (installationState.status === "database_unavailable") {
    return {
      error: "数据库当前不可用，请先检查连接状态。",
    };
  }

  if (installationState.status === "schema_missing") {
    return {
      error: "数据库表结构还没有初始化，请先运行 pnpm db:push。",
    };
  }

  const siteName = getRequiredString(formData, "siteName");
  const siteDescription = getRequiredString(formData, "siteDescription");
  const siteUrl = getValidatedUrl(getRequiredString(formData, "siteUrl"));
  const locale = getOptionalString(formData, "locale") || siteConfig.locale;
  const heroIntro = getOptionalString(formData, "heroIntro");
  const summary = getOptionalString(formData, "summary");
  const motto = getOptionalString(formData, "motto");

  if (!siteName) {
    return {
      error: "请填写站点名称。",
    };
  }

  if (!siteDescription) {
    return {
      error: "请填写站点简介。",
    };
  }

  if (!siteUrl) {
    return {
      error: "请填写有效的站点地址。",
    };
  }

  let createdAdminCredentials: { username: string; password: string } | null = null;
  let initialAuthorName = siteConfig.author;

  try {
    const adminUserCount = await countLocalAdminUsers();

    if (adminUserCount === 0) {
      const username = normalizeAdminUsername(getRequiredString(formData, "adminUsername"));
      const password = getRequiredString(formData, "adminPassword");

      if (username.length < MIN_ADMIN_USERNAME_LENGTH) {
        return {
          error: `管理员帐号至少需要 ${MIN_ADMIN_USERNAME_LENGTH} 个字符。`,
        };
      }

      if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
        return {
          error: `管理员密码至少需要 ${MIN_ADMIN_PASSWORD_LENGTH} 个字符。`,
        };
      }

      await createOwnerUser(username, await hashPassword(password));
      createdAdminCredentials = {
        username,
        password,
      };
      initialAuthorName = username;
    }

    await upsertSiteSettings({
      siteName,
      siteDescription,
      siteUrl,
      locale,
      authorName: initialAuthorName,
      authorAvatarUrl: null,
      heroIntro,
      summary,
      motto,
      email: null,
      githubUrl: null,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        error: "数据库当前不可用，请先恢复数据库后再初始化。",
      };
    }

    const code = typeof error === "object" && error ? Reflect.get(error, "code") : null;
    if (code === "P2002") {
      return {
        error: "管理员帐号已存在，请换一个用户名，或者直接登录后台。",
      };
    }

    throw error;
  }

  if (createdAdminCredentials) {
    await signIn("credentials", {
      username: createdAdminCredentials.username,
      password: createdAdminCredentials.password,
      redirectTo: "/admin",
    });
  }

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/updates");
  revalidatePath("/timeline");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  redirect("/admin");
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    return "";
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

function getValidatedUrl(value: string) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
