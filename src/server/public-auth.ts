import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/client";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { getPublicAuthConfig } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const [publicAuthConfig, siteSettings] = await Promise.all([
    getPublicAuthConfig(),
    getSiteSettings(),
  ]);
  process.env.AUTH_URL = resolveCanonicalSiteUrl(siteSettings);

  return {
    adapter: PrismaAdapter(prisma),
    secret: publicAuthConfig.authSecret ?? undefined,
    trustHost: process.env.AUTH_TRUST_HOST !== "false",
    providers: publicAuthConfig.githubCredentials
      ? [GitHub(publicAuthConfig.githubCredentials)]
      : [],
    session: {
      strategy: "database",
    },
  };
});
