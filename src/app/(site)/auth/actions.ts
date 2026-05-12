"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/server/public-auth";
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
  const redirectTo = callbackUrl ? await getPublicCallbackUrl(callbackUrl) : undefined;

  if (!config.githubCredentials) {
    return {
      error: "GitHub 登录还没有配置完整。",
    };
  }

  try {
    await signIn("github", redirectTo ? { redirectTo } : undefined);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return {
        error: "GitHub 登录配置有问题，请检查 Client ID、Client Secret 和 callback URL。",
      };
    }

    throw error;
  }

  return {
    error: null,
  };
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

async function getPublicCallbackUrl(pathname: string) {
  const siteSettings = await getSiteSettings();
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);

  try {
    return new URL(pathname, siteUrl).toString();
  } catch {
    return pathname;
  }
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}
