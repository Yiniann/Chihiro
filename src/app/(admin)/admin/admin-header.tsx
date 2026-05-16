"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  House,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Tags,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { ADMIN_NAV_ITEMS } from "@/app/(admin)/admin/utils";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { siteConfig } from "@/lib/site";

const adminNavMeta: Record<
  string,
  {
    icon: LucideIcon;
  }
> = {
  "/admin": {
    icon: LayoutDashboard,
  },
  "/admin/posts": {
    icon: NotebookPen,
  },
  "/admin/updates": {
    icon: MessageSquareText,
  },
  "/admin/pages": {
    icon: FileText,
  },
  "/admin/categories": {
    icon: Tags,
  },
  "/admin/comments": {
    icon: MessageSquareText,
  },
  "/admin/media": {
    icon: Images,
  },
  "/admin/trash": {
    icon: Trash2,
  },
  "/admin/settings": {
    icon: Settings2,
  },
};

export function AdminHeader() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const activeItem = getActiveAdminItem(pathname);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (
        mobileMenuButtonRef.current?.contains(target) ||
        mobileMenuPanelRef.current?.contains(target)
      ) {
        return;
      }

      setIsMobileNavOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileNavOpen]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/8 dark:bg-black/60 md:hidden">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.24em] text-primary/70 dark:text-primary/70">Admin</p>
          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
            {activeItem?.label ?? siteConfig.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="View site"
            className="inline-flex h-10 w-10 items-center justify-center text-zinc-600 transition hover:text-primary dark:text-zinc-300 dark:hover:text-primary"
          >
            <House className="h-4.5 w-4.5" />
          </Link>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            aria-label={isMobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center text-zinc-700 transition hover:text-primary dark:text-zinc-200 dark:hover:text-primary"
          >
            {isMobileNavOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <aside
        className={`hidden md:flex md:h-screen md:flex-col md:border-r md:border-zinc-200/80 md:bg-zinc-100 dark:md:border-white/8 dark:md:bg-[#050505] ${
          isDesktopCollapsed ? "md:w-[4.75rem]" : "md:w-[14rem]"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          isCollapsed={isDesktopCollapsed}
          onToggleCollapse={() => setIsDesktopCollapsed((current) => !current)}
        />
      </aside>

      <AnimatePresence>
        {isMobileNavOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm dark:bg-black/70 md:hidden"
          >
            <motion.div
              ref={mobileMenuPanelRef}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex h-full w-[min(82vw,18rem)] flex-col border-r border-zinc-200/80 bg-zinc-100 dark:border-white/8 dark:bg-[#050505]"
            >
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setIsMobileNavOpen(false)}
                isMobile
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname,
  isCollapsed = false,
  isMobile = false,
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-3 pb-4 pt-4">
      <div
        className={`flex px-2 py-2 ${
          isCollapsed ? "flex-col items-center gap-1.5" : "items-center gap-2.5"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={siteConfig.avatar}
          alt={`${siteConfig.name} avatar`}
          className="h-8 w-8 rounded-[1.1rem] object-cover ring-1 ring-primary/15 dark:ring-primary/20"
        />
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.92rem] font-bold text-primary">{siteConfig.name}</p>
            <p className="mt-0.5 text-xs font-semibold text-primary/70 dark:text-primary/70">Admin</p>
          </div>
        ) : null}
        {!isMobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-primary/8 hover:text-primary dark:text-zinc-500 dark:hover:bg-primary/10 dark:hover:text-primary"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex-1">
        <nav className="grid gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = isActiveAdminPath(pathname, item.href);
            const { icon: Icon } = adminNavMeta[item.href];

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center rounded-[0.85rem] px-2 py-1.5 transition ${
                  isActive
                    ? "bg-primary/8 text-primary dark:bg-primary/10 dark:text-primary"
                    : "text-zinc-500 hover:bg-primary/6 hover:text-primary dark:text-zinc-400 dark:hover:bg-primary/8 dark:hover:text-primary"
                } ${isCollapsed ? "justify-center" : "gap-3"}`}
                aria-label={isCollapsed ? item.label : undefined}
                title={isCollapsed ? item.label : undefined}
              >
                <span
                  className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "text-primary"
                      : "text-zinc-400 group-hover:text-primary dark:text-zinc-500 dark:group-hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!isCollapsed ? (
                  <span className="min-w-0 flex-1 text-[0.88rem] font-medium">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {!isCollapsed ? (
        <div className="mt-auto grid gap-2 pt-3">
          <div className="flex items-center justify-between gap-1 px-1">
            <Link
              href="/"
              onClick={onNavigate}
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-primary/8 hover:text-primary dark:text-zinc-400 dark:hover:bg-primary/10 dark:hover:text-primary"
              aria-label="查看站点"
              title="查看站点"
            >
              <House className="h-4 w-4" />
            </Link>
            <ThemeModeToggle minimal hintPlacement="top" />
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-primary/8 hover:text-primary dark:text-zinc-400 dark:hover:bg-primary/10 dark:hover:text-primary"
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getActiveAdminItem(pathname: string) {
  return ADMIN_NAV_ITEMS.find((item) => isActiveAdminPath(pathname, item.href)) ?? null;
}

function isActiveAdminPath(pathname: string, href: string) {
  if (href === "/admin/categories") {
    return (
      pathname === href ||
      pathname.startsWith("/admin/categories/") ||
      pathname === "/admin/tags" ||
      pathname.startsWith("/admin/tags/")
    );
  }

  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}
