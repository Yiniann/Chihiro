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
        className="site-meta inline-flex items-center gap-2 text-n-5 transition hover:text-n-6 dark:text-n-5 dark:hover:text-n-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回足迹
      </Link>

      <div className="surface-shell mt-10 rounded-2xl p-8">
        <p className="site-eyebrow uppercase tracking-[0.24em] text-n-4">
          Object Detail
        </p>
        <h1 className="site-title-page mt-4 tracking-tight text-n-6">
          {slug}
        </h1>
        <p className="site-body mt-4 text-n-5">
          物品长评详情页的路由已经预留好了。下一步会把 `object` 类型动态的长评内容和图片细节正式接进来。
        </p>
      </div>
    </main>
  );
}
