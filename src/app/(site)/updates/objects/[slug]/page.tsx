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
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        返回足迹
      </Link>

      <div className="mt-10 rounded-[2rem] border border-dashed border-zinc-300/80 bg-white/70 p-8 dark:border-zinc-700/80 dark:bg-zinc-900/50">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          Object Detail
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {slug}
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          物品长评详情页的路由已经预留好了。下一步会把 `object` 类型动态的长评内容和图片细节正式接进来。
        </p>
      </div>
    </main>
  );
}
