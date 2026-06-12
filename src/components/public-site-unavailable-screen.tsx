export function PublicSiteUnavailableScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
      <section className="w-full max-w-2xl">
        <p className="site-eyebrow uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">
          Service Unavailable
        </p>
        <h1 className="site-title-page mt-4 tracking-tight text-zinc-950 dark:text-zinc-50">
          503 · 数据库当前不可用
        </h1>
        <p className="site-body mt-4 text-zinc-500 dark:text-zinc-400">
          请优先检查数据库实例、网络连通性、连接串和凭据。数据库恢复后，页面会自动回到正常状态。
        </p>
      </section>
    </main>
  );
}
