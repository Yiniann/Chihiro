"use client";

import { AnimatePresence, motion, type MotionProps } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type HeaderNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type HeaderNavProps = {
  pathname: string;
  isScrolled: boolean;
  deferredIsScrolled: boolean;
  items: HeaderNavItem[];
  layoutId: string;
  className?: string;
  preserveStickyOnNavigate?: boolean;
  onNavigate?: () => void;
  onItemEnter?: (href: string) => void;
  onItemFocus?: (href: string) => void;
  isActivePath: (pathname: string, href: string) => boolean;
};

const indicatorMotion: MotionProps = {
  transition: { type: "spring", stiffness: 500, damping: 32 },
};

const iconMotion: MotionProps = {
  initial: { width: 0, opacity: 0, scale: 0, marginRight: 0 },
  animate: {
    width: "auto",
    opacity: 1,
    scale: 1,
    marginRight: 8,
  },
  exit: { width: 0, opacity: 0, scale: 0, marginRight: 0 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

export function HeaderNav({
  pathname,
  isScrolled,
  deferredIsScrolled,
  items,
  layoutId,
  className,
  preserveStickyOnNavigate = false,
  onNavigate,
  onItemEnter,
  onItemFocus,
  isActivePath,
}: HeaderNavProps) {
  return (
    <nav
      className={[
        "items-center justify-center overflow-hidden rounded-full text-sm font-medium text-n-5 transition-all duration-300 dark:text-n-5 md:flex",
        isScrolled
          ? "bg-white/80 shadow-sm dark:border dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-xl dark:backdrop-brightness-125 dark:backdrop-contrast-125 dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]"
          : "bg-transparent",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={!preserveStickyOnNavigate}
            onClick={onNavigate}
            onMouseEnter={onItemEnter ? () => onItemEnter(item.href) : undefined}
            onFocus={onItemFocus ? () => onItemFocus(item.href) : undefined}
            tabIndex={-1}
            className={`relative flex items-center gap-2 overflow-hidden rounded-none px-4 py-2 transition-colors first:rounded-l-full last:rounded-r-full ${
              active
                ? "font-semibold text-primary"
                : "text-n-5 hover:text-primary dark:text-n-5"
            }`}
          >
            {active && deferredIsScrolled ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full border border-primary/25 bg-primary/10 shadow-sm dark:border-primary/30 dark:bg-[rgba(255,255,255,0.10)] dark:backdrop-brightness-110 dark:shadow-[0_0_0_1px_rgb(var(--primary-rgb)/0.05),0_10px_24px_rgba(2,6,23,0.08)]"
                {...indicatorMotion}
              />
            ) : null}

            <span className="relative z-10 flex items-center justify-center">
              <AnimatePresence initial={false}>
                {active ? (
                  <motion.span
                    {...iconMotion}
                    className="flex items-center justify-center overflow-hidden"
                  >
                    <Icon className="h-4 w-4" />
                  </motion.span>
                ) : null}
              </AnimatePresence>
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
