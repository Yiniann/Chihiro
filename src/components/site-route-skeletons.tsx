function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "rounded-full bg-zinc-200/80 animate-pulse dark:bg-n-1/80",
        className,
      ].join(" ")}
    />
  );
}

function SkeletonTextGroup({
  lines,
}: {
  lines: Array<{
    width: string;
    className?: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <SkeletonBlock
          key={`${line.width}-${index}`}
          className={[line.width, line.className ?? "h-3.5"].filter(Boolean).join(" ")}
        />
      ))}
    </div>
  );
}

export function PostsPageContentSkeleton() {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="order-2 grid gap-5 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SkeletonBlock className="h-3.5 w-32" />
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-3.5 w-14" />
            <SkeletonBlock className="h-3.5 w-18" />
            <SkeletonBlock className="h-3.5 w-26" />
          </div>
        </div>

        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={index}
            className="border-b border-n-2 pb-6 last:border-b-0 dark:border-n-2"
          >
            <SkeletonBlock className="h-8 w-3/5 rounded-2xl" />
            <div className="mt-4">
              <SkeletonTextGroup
                lines={[
                  { width: "w-full" },
                  { width: "w-[92%]" },
                  { width: "w-[78%]" },
                ]}
              />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <SkeletonBlock className="h-3 w-18" />
                <SkeletonBlock className="h-3 w-14" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            </div>
          </article>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <SkeletonBlock className="h-3.5 w-16" />
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-3.5 w-24" />
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-3.5 w-3.5" />
              <SkeletonBlock className="h-3.5 w-3.5" />
              <SkeletonBlock className="h-3.5 w-3.5" />
            </div>
          </div>
          <SkeletonBlock className="h-3.5 w-12" />
        </div>
      </div>

      <aside className="order-1 lg:order-2 lg:sticky lg:top-28">
        <div className="border-l border-n-2 pl-6 dark:border-n-2">
          <div>
            <SkeletonBlock className="mb-3 h-3 w-16" />
            <SkeletonBlock className="h-10 w-full rounded-2xl" />
          </div>

          <div className="mt-8">
            <SkeletonBlock className="mb-4 h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }, (_, index) => (
                <SkeletonBlock key={index} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function PostDetailPageSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-16 sm:px-10">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,48rem)_16rem] lg:items-start lg:justify-center">
        <article className="min-w-0">
          <SkeletonBlock className="h-3.5 w-36" />
          <div className="mt-5 space-y-4">
            <SkeletonBlock className="h-10 w-[82%] rounded-2xl" />
            <SkeletonBlock className="h-10 w-[58%] rounded-2xl" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-28" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <SkeletonBlock className="h-6 w-18 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-7">
            <SkeletonTextGroup
              lines={[
                { width: "w-full", className: "h-4" },
                { width: "w-[90%]", className: "h-4" },
              ]}
            />
          </div>

          <div className="mt-12 space-y-8">
            {Array.from({ length: 4 }, (_, sectionIndex) => (
              <section key={sectionIndex}>
                <SkeletonBlock
                  className={[
                    "h-7 rounded-2xl",
                    sectionIndex % 2 === 0 ? "w-2/5" : "w-1/2",
                  ].join(" ")}
                />
                <div className="mt-5">
                  <SkeletonTextGroup
                    lines={[
                      { width: "w-full" },
                      { width: "w-[96%]" },
                      { width: "w-[88%]" },
                      { width: "w-[72%]" },
                    ]}
                  />
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pl-5 text-sm lg:block lg:w-64">
          <nav aria-label="文章目录加载中" className="relative flex flex-col gap-3">
            <span
              aria-hidden="true"
              className="absolute -left-5 top-0 h-20 w-[3px] rounded-full bg-zinc-200/80 dark:bg-n-1/80"
            />
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-32" />
            <SkeletonBlock className="ml-4 h-3 w-28" />
            <SkeletonBlock className="ml-4 h-3 w-20" />
            <SkeletonBlock className="h-3.5 w-28" />
            <SkeletonBlock className="h-3.5 w-36" />
          </nav>
          <div className="mt-7 flex items-center gap-1.5">
            <SkeletonBlock className="h-6 w-6" />
            <SkeletonBlock className="h-3.5 w-10" />
          </div>
        </aside>
      </div>
    </main>
  );
}

export function UpdatesPageContentSkeleton() {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SkeletonBlock className="h-3.5 w-32" />
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBlock className="h-3.5 w-14" />
          <SkeletonBlock className="h-3.5 w-16" />
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {Array.from({ length: 2 }, (_, groupIndex) => (
          <section key={groupIndex} className="space-y-6">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-7 w-14 rounded-2xl" />
              <div className="h-px flex-1 bg-zinc-200/80 dark:bg-n-1/80" />
            </div>

            <div className="grid gap-6">
              {Array.from({ length: 3 }, (_, index) => (
                <article
                  key={index}
                  className="grid gap-4 border-b border-n-2 py-6 dark:border-n-2 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-6"
                >
                  <div>
                    <SkeletonBlock className="h-3 w-10" />
                    <SkeletonBlock className="mt-3 h-9 w-12 rounded-2xl" />
                  </div>
                  <div>
                    <SkeletonTextGroup
                      lines={[
                        { width: "w-full", className: "h-4" },
                        { width: "w-[90%]", className: "h-4" },
                        { width: "w-[70%]", className: "h-4" },
                      ]}
                    />
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <SkeletonBlock className="h-3 w-14" />
                      <SkeletonBlock className="h-3 w-16" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-2">
        <SkeletonBlock className="h-3.5 w-16" />
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-3.5 w-24" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-3.5 w-3.5" />
            <SkeletonBlock className="h-3.5 w-3.5" />
            <SkeletonBlock className="h-3.5 w-3.5" />
          </div>
        </div>
        <SkeletonBlock className="h-3.5 w-12" />
      </div>
    </div>
  );
}

export function TimelinePageContentSkeleton() {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2 text-n-4">
        <SkeletonBlock className="h-18 w-28 rounded-[1.75rem]" />
        <SkeletonBlock className="h-8 w-64 rounded-2xl" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-8 w-12 rounded-full" />
          <SkeletonBlock className="h-8 w-14 rounded-full" />
          <SkeletonBlock className="h-8 w-18 rounded-full" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-2xl" />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
        <div className="hidden md:block">
          <SkeletonBlock className="h-3 w-12" />
          <div className="mt-3 flex items-baseline gap-3">
            <SkeletonBlock className="h-10 w-20 rounded-2xl" />
            <SkeletonBlock className="h-6 w-12 rounded-2xl" />
          </div>
        </div>

        <div className="relative pl-8 md:pl-10">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-gradient-to-b from-primary/20 via-zinc-200 to-zinc-100 dark:via-zinc-800 dark:to-zinc-900" />
          <div className="space-y-10">
            {Array.from({ length: 3 }, (_, groupIndex) => (
              <section key={groupIndex} className="space-y-8">
                <div className="flex justify-end">
                  <SkeletonBlock className="h-7 w-20 rounded-2xl" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-3 w-3 rounded-full" />
                    <SkeletonBlock className="h-4 w-16 rounded-2xl" />
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: 2 }, (_, index) => (
                      <article key={index} className="relative pl-2">
                        <div className="py-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <SkeletonBlock className="h-3 w-14" />
                              <SkeletonBlock className="h-3 w-10" />
                            </div>
                            <SkeletonBlock className="h-6 w-16 rounded-full" />
                          </div>
                          <SkeletonBlock className="mt-3 h-6 w-2/3 rounded-2xl" />
                          <SkeletonBlock className="mt-3 h-3 w-20" />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
