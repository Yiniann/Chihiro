export default function MorePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
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
      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
        这里适合以后放关于页面、友情链接、订阅说明、项目说明或独立专题入口。
      </p>
    </main>
  );
}
