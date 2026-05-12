import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const canonicalHostRedirect = redirectToCanonicalHost(request);

  if (canonicalHostRedirect) {
    return canonicalHostRedirect;
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (pathname === "/admin/login") {
    return redirectToSiteLogin(request, "/admin");
  }

  if (sessionToken) {
    return NextResponse.next();
  }

  return redirectToSiteLogin(request, `${pathname}${search}`);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

function redirectToCanonicalHost(request: NextRequest) {
  const canonicalHost = process.env.CANONICAL_HOST?.trim().toLowerCase();

  if (!canonicalHost) {
    return null;
  }

  const host = request.headers.get("host")?.toLowerCase().split(":")[0];

  if (!host || host === canonicalHost || isLocalHost(host)) {
    return null;
  }

  const target = request.nextUrl.clone();
  target.protocol = process.env.CANONICAL_PROTOCOL?.trim() || "https:";
  target.hostname = canonicalHost;
  target.port = "";

  return NextResponse.redirect(target, 301);
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

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
