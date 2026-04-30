import Link from "next/link";
import type { MoreSection } from "@/lib/more-sections";

export function MoreSectionPlaceholder({ section }: { section: MoreSection }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      <h1 className="flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        <span>{section.title}</span>
        <span className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          {section.eyebrow}
        </span>
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
        {section.description}
      </p>

      <section className="mt-12 rounded-3xl border border-dashed border-zinc-300/80 bg-white/60 p-8 dark:border-zinc-700/80 dark:bg-zinc-900/50">
        <p className="text-sm uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          Placeholder
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          内容还在路上
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          这里先作为 {section.title} 页的占位入口，后续可以继续补充真实内容、列表、卡片或筛选结构。
        </p>
        <div className="mt-8">
          <Link
            href="/more"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            返回远方
          </Link>
        </div>
      </section>
    </main>
  );
}
