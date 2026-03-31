"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Compass,
  FileArchive,
  GalleryVerticalEnd,
  Menu,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

const navItems = [
  {
    href: "/",
    label: "首页",
    icon: Compass,
    description: "Start with a quick introduction and the overall tone of the site.",
  },
  {
    href: "/posts",
    label: "文章",
    icon: BookOpenText,
    description: "Longer writing on products, technology, and personal expression.",
  },
  {
    href: "/updates",
    label: "动态",
    icon: Sparkles,
    description: "Short updates, experiments, and notes from ongoing work.",
  },
  {
    href: "/archives",
    label: "归档",
    icon: FileArchive,
    description: "Browse everything by time and revisit older pieces in one place.",
  },
  {
    href: "/more",
    label: "更多",
    icon: GalleryVerticalEnd,
    description: "A softer space for side pages, collections, and future ideas.",
  },
];

const publishedPosts = getPublishedPosts();
const postCategories = Array.from(
  new Set(publishedPosts.flatMap((post) => post.tags)),
).map((tag) => ({
  label: formatLabel(tag),
  href: `/posts?tag=${encodeURIComponent(tag)}`,
}));

const updateCategories = [
  { label: "Build Logs", href: "/updates?category=build-logs" },
  { label: "Notes", href: "/updates?category=notes" },
  { label: "Experiments", href: "/updates?category=experiments" },
  { label: "Changelog", href: "/updates?category=changelog" },
];

const morePlaceholders = [
  "Projects",
  "Bookmarks",
  "Colophon",
  "Reading Notes",
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaNavOpen, setIsMegaNavOpen] = useState(false);
  const [highlightedHref, setHighlightedHref] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [expandedMobileHref, setExpandedMobileHref] = useState<string | null>(null);
  const megaNavRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const getScrollTop = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const handleScroll = () => {
      setIsScrolled(getScrollTop() > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

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

  const openMegaNav = (href: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsMegaNavOpen(true);
    setHighlightedHref(href);
  };

  const closeMegaNav = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setIsMegaNavOpen(false);
      setHighlightedHref(null);
      closeTimerRef.current = null;
    }, 120);
  };

  const activeItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];
  const featuredItem =
    navItems.find((item) => item.href === highlightedHref) ?? activeItem;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-6">
      <div
        className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 transition-all duration-300 md:grid md:grid-cols-[1fr_auto_1fr] md:justify-normal sm:px-6"
      >
        <button
          ref={mobileMenuButtonRef}
          type="button"
          aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileNavOpen}
          onClick={() => {
            if (isMobileNavOpen) {
              setIsMobileNavOpen(false);
              setExpandedMobileHref(null);
              return;
            }

            setIsMobileNavOpen(true);
            setExpandedMobileHref(activeItem.href);
          }}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-700 transition dark:text-zinc-200 md:hidden ${
            isScrolled
              ? "border border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/65 dark:backdrop-blur-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              : "border border-transparent bg-transparent"
          }`}
        >
          {isMobileNavOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
        <Link
          href="/"
          className={`absolute left-1/2 -translate-x-1/2 rounded-2xl px-3 py-1.5 text-lg font-semibold tracking-tight text-primary transition md:static md:translate-x-0 md:justify-self-start ${
            isScrolled
              ? "border border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/65 dark:backdrop-blur-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              : "border border-transparent bg-transparent"
          }`}
        >
          {siteConfig.name}
        </Link>

        <div
          ref={megaNavRef}
          className="relative hidden md:flex md:justify-center"
          onMouseEnter={() => openMegaNav(activeItem.href)}
          onMouseLeave={closeMegaNav}
          onFocusCapture={() => openMegaNav(activeItem.href)}
          onBlurCapture={(event) => {
            if (!megaNavRef.current?.contains(event.relatedTarget as Node | null)) {
              closeMegaNav();
            }
          }}
        >
          <nav
            className={`items-center justify-center overflow-hidden rounded-full text-sm font-medium text-zinc-600 transition-all duration-300 dark:text-zinc-300 md:flex ${
              isScrolled
                ? "bg-white/80 shadow-sm dark:border dark:border-zinc-800/70 dark:bg-zinc-950/58 dark:backdrop-blur-xl dark:shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
                : "bg-transparent"
            }`}
          >
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => openMegaNav(item.href)}
                  onFocus={() => openMegaNav(item.href)}
                  className={`relative flex items-center gap-2 overflow-hidden rounded-none px-4 py-2 transition-colors first:rounded-l-full last:rounded-r-full ${
                    active
                      ? "font-semibold text-primary"
                      : "text-zinc-600 hover:text-primary dark:text-zinc-300"
                  }`}
                >
                  {active && isScrolled ? (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-full border border-primary/25 bg-primary/10 shadow-sm dark:border-sky-300/15 dark:bg-sky-400/10 dark:shadow-[0_0_0_1px_rgba(125,211,252,0.05),0_12px_28px_rgba(2,6,23,0.42)]"
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    />
                  ) : null}

                  <span className="relative z-10 flex items-center justify-center">
                    <AnimatePresence initial={false}>
                      {active ? (
                        <motion.span
                          initial={{ width: 0, opacity: 0, scale: 0, marginRight: 0 }}
                          animate={{
                            width: "auto",
                            opacity: 1,
                            scale: 1,
                            marginRight: 8,
                          }}
                          exit={{ width: 0, opacity: 0, scale: 0, marginRight: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
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

          <AnimatePresence>
            {isMegaNavOpen ? (
              <>
                <div className="absolute left-0 right-0 top-full h-3" />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2"
                >
                  <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white/92 p-3 shadow-[0_20px_60px_rgba(24,24,27,0.14)] backdrop-blur-xl dark:border-zinc-800/70 dark:bg-[rgba(10,10,14,0.82)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.48)]">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between rounded-[1.2rem] border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/75">
                        <div>
                          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                            Menu
                          </p>
                          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                            {featuredItem.label}
                          </h2>
                        </div>
                        <Link
                          href={featuredItem.href}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-primary dark:text-zinc-300 dark:hover:text-sky-300"
                        >
                          Open
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {renderMegaNavContent(featuredItem.href)}
                    </div>
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="shrink-0 md:justify-self-end">
          <Link
            href="/admin"
            aria-label="Sign in"
            className={`inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-zinc-800 transition ${
              isScrolled
                ? "border border-zinc-200/80 bg-white/80 shadow-sm hover:border-primary/30 hover:text-primary dark:border-zinc-800/70 dark:bg-zinc-950/65 dark:text-zinc-200 dark:backdrop-blur-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                : "border border-transparent bg-transparent hover:text-primary dark:text-zinc-200"
            }`}
          >
            <UserRound className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {isMobileNavOpen ? (
          <motion.div
            ref={mobileMenuPanelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mx-auto mt-2 w-full max-w-6xl px-1 md:hidden"
          >
            <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/92 p-3 shadow-[0_18px_50px_rgba(24,24,27,0.12)] backdrop-blur-xl dark:border-zinc-800/70 dark:bg-[rgba(10,10,14,0.84)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.44)]">
              <nav className="grid gap-2">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  const expanded = expandedMobileHref === item.href;

                  return (
                    <div
                      key={item.href}
                      className={`rounded-[1.1rem] transition ${
                        active || expanded
                          ? "bg-primary/8 dark:bg-primary/15"
                          : "bg-zinc-50/80 dark:bg-zinc-900"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 px-2 py-2 ${
                          active ? "text-primary" : "text-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            setIsMobileNavOpen(false);
                            setExpandedMobileHref(null);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.95rem] px-1.5 py-1 transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium">{item.label}</p>
                        </Link>
                        <button
                          type="button"
                          aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                          onClick={() =>
                            setExpandedMobileHref((current) =>
                              current === item.href ? null : item.href,
                            )
                          }
                          className={`inline-flex h-9 min-w-11 shrink-0 items-center justify-center rounded-2xl border px-2 transition ${
                            expanded
                              ? "border-primary/20 bg-primary/10 text-primary dark:border-sky-300/20 dark:bg-sky-400/12 dark:text-sky-300"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                          }`}
                        >
                          <motion.span
                            animate={{ rotate: expanded ? 90 : 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="inline-flex"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.span>
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {expanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3">
                              {renderMobileNavContent(item.href, () =>
                                setIsMobileNavOpen(false),
                              )}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function renderMegaNavContent(href: string) {
  switch (href) {
    case "/":
      return (
        <MegaNavSection eyebrow="Overview" badge="2">
          <div className="grid gap-2 sm:grid-cols-2">
            <MegaNavLinkCard href="/" title="此站点" eyebrow="Home" />
            <MegaNavLinkCard href="/more" title="自述" eyebrow="About" />
          </div>
        </MegaNavSection>
      );
    case "/posts":
      return (
        <MegaNavSection eyebrow="Categories" badge={String(postCategories.length)}>
          <div className="flex flex-wrap gap-2">
            {postCategories.map((category) => (
              <MegaNavChip key={category.href} href={category.href} label={category.label} />
            ))}
          </div>
        </MegaNavSection>
      );
    case "/updates":
      return (
        <MegaNavSection eyebrow="Categories" badge={String(updateCategories.length)}>
          <div className="flex flex-wrap gap-2">
            {updateCategories.map((category) => (
              <MegaNavChip key={category.href} href={category.href} label={category.label} />
            ))}
          </div>
        </MegaNavSection>
      );
    case "/archives":
      return (
        <div className="grid gap-2.5">
          <MegaNavSection eyebrow="Articles" badge="3">
            <div className="grid gap-2">
              {publishedPosts.slice(0, 3).map((post) => (
                <MegaNavArticleLink
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  title={post.title}
                />
              ))}
            </div>
          </MegaNavSection>
          <MegaNavSection eyebrow="Update Archives" badge={String(updateCategories.length)}>
            <div className="flex flex-wrap gap-2">
              {updateCategories.map((category) => (
                <MegaNavChip key={category.href} href={category.href} label={category.label} />
              ))}
            </div>
          </MegaNavSection>
        </div>
      );
    case "/more":
      return (
        <MegaNavSection eyebrow="Placeholder Grid" badge={String(morePlaceholders.length)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {morePlaceholders.map((label) => (
              <MegaNavPlaceholderCard key={label} label={label} />
            ))}
          </div>
        </MegaNavSection>
      );
    default:
      return null;
  }
}

function renderMobileNavContent(href: string, onNavigate: () => void) {
  switch (href) {
    case "/":
      return (
        <div className="grid gap-2">
          <MobileNavSubLink href="/" label="此站点" onNavigate={onNavigate} />
          <MobileNavSubLink href="/more" label="自述" onNavigate={onNavigate} />
        </div>
      );
    case "/posts":
      return (
        <div className="flex flex-wrap gap-2">
          {postCategories.map((category) => (
            <MobileNavChip
              key={category.href}
              href={category.href}
              label={category.label}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      );
    case "/updates":
      return (
        <div className="flex flex-wrap gap-2">
          {updateCategories.map((category) => (
            <MobileNavChip
              key={category.href}
              href={category.href}
              label={category.label}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      );
    case "/archives":
      return (
        <div className="grid gap-2">
          {publishedPosts.slice(0, 3).map((post) => (
            <MobileNavSubLink
              key={post.id}
              href={`/posts/${post.slug}`}
              label={post.title}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      );
    case "/more":
      return (
        <div className="flex flex-wrap gap-2">
          {morePlaceholders.map((label) => (
            <span
              key={label}
              className="rounded-full border border-dashed border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              {label}
            </span>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function MegaNavLinkCard({
  href,
  title,
  eyebrow,
}: {
  href: string;
  title: string;
  eyebrow: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.15rem] border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,244,245,0.8))] px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(17,17,19,0.9))] dark:hover:border-sky-300/15 dark:hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {eyebrow}
          </p>
          <span className="mt-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </span>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-400 transition group-hover:text-primary dark:bg-zinc-800/90 dark:text-zinc-500 dark:group-hover:text-sky-300">
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function MegaNavChip({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,244,245,0.85))] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,rgba(39,39,42,0.92),rgba(24,24,27,0.96))] dark:text-zinc-300 dark:hover:border-sky-300/20 dark:hover:text-sky-300"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 transition group-hover:bg-primary dark:bg-zinc-600 dark:group-hover:bg-sky-300" />
      {label}
    </Link>
  );
}

function MegaNavSection({
  eyebrow,
  badge,
  children,
}: {
  eyebrow: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.2rem] border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(250,250,250,0.92),rgba(244,244,245,0.78))] px-3.5 py-3 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(25,25,28,0.96),rgba(16,16,19,0.9))]">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          {eyebrow}
        </p>
        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[0.65rem] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          {badge}
        </span>
      </div>
      {children}
    </section>
  );
}

function MegaNavArticleLink({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-[1rem] border border-zinc-200/80 bg-white/90 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900/85 dark:hover:border-sky-300/15 dark:hover:text-sky-300"
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-primary dark:text-zinc-500 dark:group-hover:text-sky-300" />
    </Link>
  );
}

function MegaNavPlaceholderCard({ label }: { label: string }) {
  return (
    <div className="rounded-[1.05rem] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,250,0.9),rgba(244,244,245,0.72))] px-3.5 py-3 dark:border-zinc-700 dark:bg-[linear-gradient(180deg,rgba(32,32,36,0.82),rgba(22,22,26,0.78))]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
      </div>
    </div>
  );
}

function MobileNavSubLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-primary/20 hover:text-primary dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:text-sky-300"
    >
      <span>{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
    </Link>
  );
}

function MobileNavChip({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-primary/25 hover:text-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-sky-300"
    >
      {label}
    </Link>
  );
}

function formatLabel(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
