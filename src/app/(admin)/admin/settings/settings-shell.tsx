"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SETTINGS_NAV_ITEMS } from "@/app/(admin)/admin/settings/nav-items";

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-8 lg:self-start lg:border-r lg:border-dashed lg:border-zinc-200/80 lg:pr-4 dark:lg:border-white/8">
        <nav
          aria-label="设置导航"
          className="grid grid-cols-2 gap-1 pb-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1 lg:overflow-visible lg:pb-0 lg:pl-3"
        >
          {SETTINGS_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-w-0 items-center gap-2 border-b px-3 py-2 transition lg:-ml-px lg:items-start lg:border-b-0 lg:border-l ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-primary dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-primary"
                }`}
              >
                <span
                  className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center transition lg:mt-0.5 ${
                    isActive
                      ? "text-primary"
                      : "text-zinc-400 group-hover:text-primary dark:text-zinc-500 dark:group-hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.88rem] font-medium">
                    <span className="sm:hidden">{item.label.replace(/设置$/u, "")}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                  <span
                    className={`mt-0.5 hidden text-xs leading-5 lg:block ${
                      isActive
                        ? "text-primary/80 dark:text-primary/80"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
