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
  if (process.env.CANONICAL_REDIRECT !== "true") {
    return null;
  }

  const canonicalUrl = getCanonicalUrl();

  if (!canonicalUrl || isLocalHost(canonicalUrl.hostname)) {
    return null;
  }

  const host = getRequestHost(request);

  if (!host || host === canonicalUrl.hostname || isLocalHost(host)) {
    return null;
  }

  const target = request.nextUrl.clone();
  target.protocol = canonicalUrl.protocol;
  target.hostname = canonicalUrl.hostname;
  target.port = "";

  return NextResponse.redirect(target, 301);
}

function getCanonicalUrl() {
  const configuredUrl =
    process.env.CANONICAL_URL?.trim() ||
    getUrlFromHost(process.env.CANONICAL_HOST, process.env.CANONICAL_PROTOCOL) ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl);
  } catch {
    return null;
  }
}

function getUrlFromHost(host: string | undefined, protocol: string | undefined) {
  const trimmedHost = host?.trim();

  if (!trimmedHost) {
    return null;
  }

  return `${protocol?.trim() || "https:"}//${trimmedHost}`;
}

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0] ?? request.headers.get("host");
  return host?.toLowerCase().split(":")[0] ?? null;
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
