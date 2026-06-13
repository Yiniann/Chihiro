import type { HomeSection } from "@/lib/home-sections";

export function HomeSectionPlaceholder({ section }: { section: HomeSection }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      <p className="site-eyebrow uppercase tracking-[0.28em] text-n-5">
        {section.eyebrow}
      </p>
      <h1 className="site-title-page mt-4 tracking-tight text-n-6">
        {section.title}
      </h1>
      <p className="site-body mt-4 max-w-2xl text-n-5">
        {section.description}
      </p>
    </main>
  );
}
