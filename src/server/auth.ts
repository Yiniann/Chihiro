import "server-only";

import { redirect } from "next/navigation";
import { getAdminBackendStatus } from "@/server/admin-backend";
import { isDatabaseUnavailableError } from "@/server/database-errors";
import { auth as publicAuth } from "@/server/public-auth";
import { countLocalAdminUsers } from "@/server/repositories/users";

export async function hasAdminUsers() {
  return (await countLocalAdminUsers()) > 0;
}

export async function isAdminAuthenticated() {
  return isPublicAdminAuthenticated();
}

export async function isOwnerAuthenticated() {
  return isPublicOwnerAuthenticated();
}

export async function requireAdminSession(nextPath = "/admin") {
  try {
    if (!(await isAdminAuthenticated())) {
      redirect(createSiteLoginRedirectHref());
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      redirect("/admin");
    }

    throw error;
  }
}

export async function requireOwnerSession(nextPath = "/admin/settings/users") {
  try {
    if (!(await isOwnerAuthenticated())) {
      redirect(createSiteLoginRedirectHref());
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      redirect("/admin");
    }

    throw error;
  }
}

async function isPublicAdminAuthenticated() {
  const session = await publicAuth();
  return session?.user?.role === "ADMIN" || session?.user?.role === "OWNER";
}

async function isPublicOwnerAuthenticated() {
  const session = await publicAuth();
  return session?.user?.role === "OWNER";
}

function createSiteLoginRedirectHref() {
  const params = new URLSearchParams();
  params.set("admin-required", "1");
  return `/?${params.toString()}`;
}
