import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNT_LINK_INTENT_COOKIE,
  ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS,
  isSupportedAccountLinkProvider,
} from "@/lib/account-linking";
import { auth } from "@/server/public-auth";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      provider: string;
    }>;
  },
) {
  const { provider } = await context.params;

  if (!isSupportedAccountLinkProvider(provider)) {
    return NextResponse.redirect(new URL("/auth/error?error=InvalidProvider", request.url));
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/error?error=AccountLinkSigninRequired", request.url));
  }

  const next = getSafeNext(request);
  next.searchParams.set("linked", provider);

  const signInUrl = new URL(`/api/auth/signin/${provider}`, request.url);
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

function getSafeNext(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, request.url);
  }

  return new URL("/admin/settings/users", request.url);
}
