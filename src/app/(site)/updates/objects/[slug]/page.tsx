import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type UpdateObjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: UpdateObjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: slug,
  };
}

export default async function UpdateObjectDetailPage({
  params,
}: UpdateObjectDetailPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 sm:px-10">
      <Link
        href="/updates"
        className="site-meta inline-flex items-center gap-2 text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        返回足迹
      </Link>

      <div className="mt-10 rounded-2xl border border-zinc-200/80 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]">
        <p className="site-eyebrow uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          Object Detail
        </p>
        <h1 className="site-title-page mt-4 tracking-tight text-zinc-950 dark:text-zinc-50">
          {slug}
        </h1>
        <p className="site-body mt-4 text-zinc-600 dark:text-zinc-300">
          物品长评详情页的路由已经预留好了。下一步会把 `object` 类型动态的长评内容和图片细节正式接进来。
        </p>
      </div>
    </main>
  );
}
