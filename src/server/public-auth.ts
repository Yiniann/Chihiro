import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextRequest } from "next/server";
import { ACCOUNT_LINK_INTENT_COOKIE } from "@/lib/account-linking";
import { prisma } from "@/server/db/client";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { normalizeAdminUsername } from "@/lib/admin-auth";
import { verifyPasswordHash } from "@/server/passwords";
import { getPublicAuthConfig } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";
import { findPasswordUserByUsername } from "@/server/repositories/users";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

export const { handlers, auth, signIn, signOut } = NextAuth(async (request) => {
  const [publicAuthConfig, siteSettings] = await Promise.all([
    getPublicAuthConfig(),
    getSiteSettings(),
  ]);
  process.env.AUTH_URL = resolveCanonicalSiteUrl(siteSettings);
  const requestCookies = getRequestCookies(request);
  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => Boolean(requestCookies[name]));
  const accountLinkIntent = requestCookies[ACCOUNT_LINK_INTENT_COOKIE] ?? null;

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
      ...(publicAuthConfig.googleCredentials ? [Google(publicAuthConfig.googleCredentials)] : []),
    ],
    session: {
      strategy: "jwt",
    },
    pages: {
      error: "/auth/error",
    },
    callbacks: {
      signIn({ account }) {
        if (!account || (account.type !== "oauth" && account.type !== "oidc")) {
          return true;
        }

        if (!hasSessionCookie) {
          return true;
        }

        if (accountLinkIntent === account.provider) {
          return true;
        }

        return "/auth/error?error=AccountLinkIntentRequired";
      },
      jwt({ token, user, account }) {
        if (account?.provider === "github" || account?.provider === "google") {
          token.provider = account.provider;
        }

        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }

        if (typeof token.provider !== "string" && typeof user?.id === "string") {
          token.provider = "credentials";
        }

        return token;
      },
      session({ session, token, user }) {
        const sessionProvider =
          typeof token.provider === "string"
            ? token.provider
            : user?.id
              ? "credentials"
              : null;

        return {
          ...session,
          user: {
            ...session.user,
            id: typeof token.id === "string" ? token.id : "",
            name: typeof token.name === "string" ? token.name : null,
            email: typeof token.email === "string" ? token.email : null,
            image: typeof token.picture === "string" ? token.picture : null,
            role:
              token.role === "ADMIN" || token.role === "OWNER" || token.role === "USER"
                ? token.role
                : "USER",
            provider:
              sessionProvider === "github" ||
              sessionProvider === "google" ||
              sessionProvider === "credentials"
                ? sessionProvider
                : null,
          },
        };
      },
    },
  };
});

function getRequestCookies(request: NextRequest | Request | undefined) {
  const cookieHeader = request?.headers.get("cookie");

  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf("=");
        const key = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
        const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : "";
        return [key, decodeURIComponent(value)];
      }),
  );
}
