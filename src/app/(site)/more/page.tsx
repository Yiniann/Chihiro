import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Handshake } from "lucide-react";
import { moreSections } from "@/lib/more-sections";
import { listPublicStandalonePagesForNavigation } from "@/server/public-content";
import { StandalonePageNavGroup } from "@prisma/client";

export const metadata: Metadata = {
  title: "远方",
};

const sectionIcons = {
  projects: BriefcaseBusiness,
  friends: Handshake,
  bookmarks: Bookmark,
} as const;

export default async function MorePage() {
  const standalonePages = await listPublicStandalonePagesForNavigation(
    StandalonePageNavGroup.MORE,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">More</p>
      <h1 className="mt-4 flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        <span>远方</span>
        <span className="text-base font-medium tracking-normal text-zinc-400 dark:text-zinc-500">
          ·
        </span>
        <span className="text-base font-medium tracking-normal text-zinc-500 dark:text-zinc-400">
          更多功能 
        </span>
      </h1>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {moreSections.map((section) => (
          (() => {
            const Icon = sectionIcons[section.slug as keyof typeof sectionIcons];

            return (
              <Link
                key={section.slug}
                href={section.href}
                aria-label={`进入${section.title}页面`}
                className="group flex items-start gap-4 rounded-3xl px-1 py-6 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <span className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="flex items-baseline gap-3 text-2xl font-semibold tracking-tight text-zinc-950 transition group-hover:text-primary dark:text-zinc-50">
                    <span>{section.title}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                      {section.eyebrow}
                    </span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {section.description}
                  </p>
                </div>
              </Link>
            );
          })()
        ))}
      </section>
      {standalonePages.length > 0 ? (
        <section className="mt-16 border-t border-zinc-200/80 pt-10 dark:border-zinc-800/80">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            Pages
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {standalonePages.map((page) => (
              <Link
                key={page.id}
                href={page.href}
                className="rounded-3xl border border-zinc-200/80 px-5 py-5 text-zinc-700 transition hover:border-primary/30 hover:text-primary dark:border-zinc-800/80 dark:text-zinc-200 dark:hover:border-primary/30"
              >
                <p className="text-sm font-medium">{page.navLabel}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  /{page.slug}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
