import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

const devUserEmail = "dev-reader@example.local";
const devUserImage = "https://avatars.githubusercontent.com/u/583231?v=4";
const devUserName = "Dev Octocat";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: {
      email: devUserEmail,
    },
    create: {
      name: devUserName,
      email: devUserEmail,
      image: devUserImage,
    },
    update: {
      name: devUserName,
      image: devUserImage,
    },
    select: {
      id: true,
    },
  });
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  const redirectTo = getSafeRedirect(request);
  const response = NextResponse.redirect(redirectTo);
  const cookieOptions = {
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  } as const;

  response.cookies.set("authjs.session-token", sessionToken, {
    ...cookieOptions,
    secure: false,
  });
  response.cookies.set("__Secure-authjs.session-token", sessionToken, {
    ...cookieOptions,
    secure: true,
  });

  return response;
}

function getSafeRedirect(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, request.url);
  }

  return new URL("/", request.url);
}
