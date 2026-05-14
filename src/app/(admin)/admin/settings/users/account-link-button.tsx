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
      className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {`绑定 ${label}`}
    </button>
  );
}
