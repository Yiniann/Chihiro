"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function FriendsPageToast({
  notice,
  error,
}: {
  notice: string | null;
  error: string | null;
}) {
  const handledRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    if (handledRef.current || (!notice && !error)) {
      return;
    }

    handledRef.current = true;

    if (error) {
      showToast(error, "error");
    } else if (notice) {
      showToast(notice, "success");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("notice");
    nextParams.delete("error");
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [error, notice, pathname, router, searchParams, showToast]);

  return null;
}
