import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const legacyAdminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const publicSessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (pathname === "/admin/login") {
    return redirectToSiteLogin(request, "/admin");
  }

  if (legacyAdminToken || publicSessionToken) {
    return NextResponse.next();
  }

  return redirectToSiteLogin(request, `${pathname}${search}`);
}

export const config = {
  matcher: ["/admin/:path*"],
};

function getSafeAdminPath(value: string | null) {
  if (!value || !value.startsWith("/admin")) {
    return null;
  }

  return value;
}

function redirectToSiteLogin(request: NextRequest, next: string) {
  const target = new URL("/", request.url);
  target.searchParams.set("admin-login", "1");
  target.searchParams.set("next", getSafeAdminPath(next) ?? "/admin");
  return NextResponse.redirect(target);
}
