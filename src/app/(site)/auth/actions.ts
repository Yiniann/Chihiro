"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/server/public-auth";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { getPublicAuthConfig } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

export type PublicSignInState = {
  error: string | null;
};

export async function signInWithGitHubAction(
  _previousState: PublicSignInState,
  formData: FormData,
): Promise<PublicSignInState> {
  const config = await getPublicAuthConfig();
  const callbackUrl = getCallbackUrl(formData);

  if (!config.githubCredentials) {
    return {
      error: "GitHub 登录还没有配置完整。",
    };
  }

  redirect(await getPublicSignInUrl(callbackUrl));
}

export async function signOutPublicUserAction() {
  await signOut();
}

function getCallbackUrl(formData: FormData) {
  const value = formData.get("callbackUrl");

  if (typeof value !== "string") {
    return null;
  }

  return value.startsWith("/") ? value : null;
}

async function getPublicSignInUrl(pathname: string | null) {
  const siteSettings = await getSiteSettings();
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const signInUrl = new URL("/api/auth/signin/github", siteUrl);

  if (pathname) {
    signInUrl.searchParams.set("callbackUrl", new URL(pathname, siteUrl).toString());
  }

  return signInUrl.toString();
}
