import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/client";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { normalizeAdminUsername } from "@/lib/admin-auth";
import { verifyPasswordHash } from "@/server/passwords";
import { getPublicAuthConfig } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";
import { findPasswordUserByUsername } from "@/server/repositories/users";

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
    providers: [
      Credentials({
        name: "Password",
        credentials: {
          username: {
            label: "用户名",
            type: "text",
          },
          password: {
            label: "密码",
            type: "password",
          },
        },
        async authorize(credentials) {
          const username =
            typeof credentials.username === "string"
              ? normalizeAdminUsername(credentials.username)
              : "";
          const password =
            typeof credentials.password === "string" ? credentials.password.trim() : "";

          if (!username || !password) {
            return null;
          }

          const user = await findPasswordUserByUsername(username);

          if (!user?.passwordHash) {
            return null;
          }

          const passwordMatches = await verifyPasswordHash(password, user.passwordHash);

          if (!passwordMatches) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        },
      }),
      ...(publicAuthConfig.githubCredentials ? [GitHub(publicAuthConfig.githubCredentials)] : []),
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }

        return token;
      },
      session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: typeof token.id === "string" ? token.id : "",
            role:
              token.role === "ADMIN" || token.role === "OWNER" || token.role === "USER"
                ? token.role
                : "USER",
          },
        };
      },
    },
  };
});
