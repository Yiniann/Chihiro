"use client";

import { useEffect } from "react";
import { ACCOUNT_LINK_INTENT_COOKIE } from "@/lib/account-linking";

export function ClearLinkIntent() {
  useEffect(() => {
    document.cookie = `${ACCOUNT_LINK_INTENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }, []);

  return null;
}
