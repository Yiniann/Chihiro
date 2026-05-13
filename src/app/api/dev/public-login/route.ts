import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { hashPassword } from "@/server/passwords";
import { signIn } from "@/server/public-auth";

const devUserEmail = "dev-reader@example.local";
const devUserImage = "https://avatars.githubusercontent.com/u/583231?v=4";
const devUserName = "Dev Octocat";
const devUsername = "dev-reader";
const devPassword = "dev-reader-password";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const devPasswordHash = await hashPassword(devPassword);

  await prisma.user.upsert({
    where: {
      email: devUserEmail,
    },
    create: {
      username: devUsername,
      passwordHash: devPasswordHash,
      name: devUserName,
      email: devUserEmail,
      image: devUserImage,
    },
    update: {
      username: devUsername,
      passwordHash: devPasswordHash,
      name: devUserName,
      image: devUserImage,
    },
  });

  const redirectTo = getSafeRedirect(request);
  const redirectUrl = await signIn("credentials", {
    username: devUsername,
    password: devPassword,
    redirect: false,
    redirectTo: redirectTo.pathname + redirectTo.search,
  });

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

function getSafeRedirect(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, request.url);
  }

  return new URL("/", request.url);
}
