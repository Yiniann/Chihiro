"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LiveSearchInputProps = {
  defaultValue: string;
  placeholder?: string;
  sort?: string;
};

export function LiveSearchInput({
  defaultValue,
  placeholder = "搜索标题...",
  sort,
}: LiveSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (sort) {
        params.set("sort", sort);
      } else {
        params.delete("sort");
      }

      const trimmedValue = value.trim();

      if (trimmedValue) {
        params.set("q", trimmedValue);
      } else {
        params.delete("q");
      }

      const nextQuery = params.toString();
      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextHref, { scroll: false });
    }, 220);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname, router, searchParams, sort, value]);

  return (
    <label className="relative block w-full max-w-[28rem]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-zinc-50/90 pl-11 pr-4 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[rgb(var(--primary-rgb)/0.4)] focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100 dark:hover:border-white/15 dark:focus:border-[rgb(var(--primary-rgb)/0.4)] dark:focus:bg-white/[0.06]"
      />
    </label>
  );
}
