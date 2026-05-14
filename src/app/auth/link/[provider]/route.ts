import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNT_LINK_INTENT_COOKIE,
  ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS,
  isSupportedAccountLinkProvider,
} from "@/lib/account-linking";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { auth } from "@/server/public-auth";
import { getSiteSettings } from "@/server/repositories/site";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      provider: string;
    }>;
  },
) {
  const { provider } = await context.params;
  const siteSettings = await getSiteSettings();
  const baseUrl = resolveCanonicalSiteUrl(siteSettings);

  if (!isSupportedAccountLinkProvider(provider)) {
    return NextResponse.redirect(new URL("/auth/error?error=InvalidProvider", baseUrl));
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/error?error=AccountLinkSigninRequired", baseUrl));
  }

  const next = getSafeNext(request, baseUrl);
  next.searchParams.set("linked", provider);

  const signInUrl = new URL(`/api/auth/signin/${provider}`, baseUrl);
  signInUrl.searchParams.set("callbackUrl", next.pathname + next.search);

  const response = NextResponse.redirect(signInUrl);
  response.cookies.set({
    name: ACCOUNT_LINK_INTENT_COOKIE,
    value: provider,
    maxAge: ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    httpOnly: false,
  });
  return response;
}

function getSafeNext(request: NextRequest, baseUrl: string) {
  const next = request.nextUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, baseUrl);
  }

  return new URL("/admin/settings/users", baseUrl);
}
