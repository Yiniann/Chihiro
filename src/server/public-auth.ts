import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/client";
import { getPublicAuthConfig } from "@/server/repositories/public-interactions";

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const publicAuthConfig = await getPublicAuthConfig();

  return {
    adapter: PrismaAdapter(prisma),
    secret: publicAuthConfig.authSecret ?? undefined,
    trustHost: true,
    providers: publicAuthConfig.githubCredentials
      ? [GitHub(publicAuthConfig.githubCredentials)]
      : [],
    session: {
      strategy: "database",
    },
  };
});
