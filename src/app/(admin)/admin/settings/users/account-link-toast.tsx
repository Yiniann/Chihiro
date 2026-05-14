"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { ACCOUNT_LINK_INTENT_COOKIE, getProviderLabel } from "@/lib/account-linking";

export function AccountLinkToast({ linkedProvider }: { linkedProvider: string | null }) {
  const handledRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    document.cookie = `${ACCOUNT_LINK_INTENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }, []);

  useEffect(() => {
    if (!linkedProvider || handledRef.current) {
      return;
    }

    handledRef.current = true;
    showToast(`${getProviderLabel(linkedProvider)} 已绑定到当前 Owner 帐号。`);
    router.replace(pathname, { scroll: false });
  }, [linkedProvider, pathname, router, showToast]);

  return null;
}
