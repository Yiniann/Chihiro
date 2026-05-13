import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin-auth";
import { getAdminBackendStatus } from "@/server/admin-backend";
import { isDatabaseUnavailableError } from "@/server/database-errors";
import { auth as publicAuth } from "@/server/public-auth";
import { countLocalAdminUsers, createPublicSessionRecord } from "@/server/repositories/users";

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

export async function createPublicSessionForUser(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  await createPublicSessionRecord(userId, sessionToken, expires);

  const cookieStore = await cookies();
  cookieStore.set(getPublicSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
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

function getPublicSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}
