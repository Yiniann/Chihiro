import Link from "next/link";
import { requireAdminSession } from "@/server/auth";
import { AdminHeader } from "@/app/(admin)/admin/admin-header";
import { getAdminBackendStatus, getAdminBackendStatusMessage } from "@/server/admin-backend";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const backendStatus = await getAdminBackendStatus();

  if (backendStatus !== "ready") {
    const message = getAdminBackendStatusMessage(backendStatus);

    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <section className="w-full max-w-2xl rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-[0_24px_70px_rgba(24,24,27,0.12)] dark:border-white/10 dark:bg-[#111111] dark:shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:p-10">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.26em] text-zinc-400 dark:text-zinc-500">
              Admin
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              {message.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              {message.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                返回站点
              </Link>
              {backendStatus === "missing_database" ||
              backendStatus === "schema_missing" ||
              backendStatus === "needs_installation" ? (
                <Link
                  href="/install"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  前往初始化
                </Link>
              ) : null}
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                数据库恢复后，刷新页面即可继续登录后台。
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  await requireAdminSession();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100 md:h-screen md:overflow-hidden">
      <div className="md:flex md:h-screen">
        <AdminHeader />
        <main className="min-w-0 flex-1 px-4 pb-4 pt-4 md:h-screen md:overflow-y-auto md:px-6 md:py-6">
          <section className="mx-auto min-h-[calc(100vh-5.5rem)] min-w-0 max-w-7xl md:min-h-full">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
