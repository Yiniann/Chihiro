import Link from "next/link";
import type { MoreSection } from "@/lib/more-sections";

export function MoreSectionPlaceholder({ section }: { section: MoreSection }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      <h1 className="site-title-page flex flex-wrap items-baseline gap-3 tracking-tight text-n-6">
        <span>{section.title}</span>
        <span className="site-eyebrow uppercase tracking-[0.24em] text-n-4">
          {section.eyebrow}
        </span>
      </h1>
      <p className="site-body mt-4 max-w-2xl text-n-5">
        {section.description}
      </p>

      <section className="mt-12 rounded-3xl border border-dashed border-n-3/80 bg-white/60 p-8 dark:border-n-3/80 dark:bg-n-1/50">
        <p className="site-eyebrow uppercase tracking-[0.22em] text-n-4">
          Placeholder
        </p>
        <h2 className="site-title-h2 mt-4 tracking-tight text-n-6">
          内容还在路上
        </h2>
        <p className="site-body mt-4 max-w-2xl text-n-5">
          这里先作为 {section.title} 页的占位入口，后续可以继续补充真实内容、列表、卡片或筛选结构。
        </p>
        <div className="mt-8">
          <Link
            href="/more"
            className="site-meta inline-flex items-center gap-2 font-medium text-primary transition hover:opacity-80"
          >
            返回远方
          </Link>
        </div>
      </section>
    </main>
  );
}
