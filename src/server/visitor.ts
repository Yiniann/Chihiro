import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const VISITOR_COOKIE_NAME = "chihiro_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export async function getOrCreateVisitorId(response: NextResponse) {
  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  const visitorId = isValidVisitorId(existingVisitorId)
    ? existingVisitorId
    : crypto.randomUUID();

  if (visitorId !== existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return visitorId;
}

function isValidVisitorId(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{16,80}$/.test(value));
}
