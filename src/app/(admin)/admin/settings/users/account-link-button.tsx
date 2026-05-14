"use client";

import { signIn } from "next-auth/react";
import { ACCOUNT_LINK_INTENT_COOKIE, ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS } from "@/lib/account-linking";

export function AccountLinkButton({
  provider,
  label,
  siteUrl,
}: {
  provider: "github" | "google";
  label: string;
  siteUrl: string;
}) {
  async function handleClick() {
    document.cookie = `${ACCOUNT_LINK_INTENT_COOKIE}=${encodeURIComponent(provider)}; Max-Age=${ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;

    await signIn(provider, {
      callbackUrl: new URL(`/admin/settings/users?linked=${encodeURIComponent(provider)}`, siteUrl).toString(),
    });
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      className="border-b border-transparent px-0 py-1 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
    >
      {`绑定 ${label}`}
    </button>
  );
}
