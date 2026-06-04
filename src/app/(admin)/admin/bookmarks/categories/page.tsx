import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import { listBookmarkCategoriesForAdmin } from "@/server/repositories/bookmark-categories";

export default async function AdminBookmarkCategoriesPage() {
  const categories = await listBookmarkCategoriesForAdmin();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">书签分类</p>
          </div>

          <Link
            href="/admin/bookmarks/categories/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            添加分类
          </Link>
        </div>
      </section>

      {categories.length > 0 ? (
        <div className="grid gap-0">
          {categories.map((category) => (
            <article
              key={category.id}
              className="border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 last:pb-0 dark:border-zinc-800/80"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/bookmarks/categories/${category.id}`}
                      className="text-lg font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50"
                    >
                      {category.name}
                    </Link>
                    {category.eyebrow ? (
                      <span className="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                        {category.eyebrow}
                      </span>
                    ) : null}
                  </div>

                  {category.description ? (
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {category.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{category.slug}</span>
                    <span>排序 {category.sortOrder}</span>
                    <span>{formatAdminNumber(category.bookmarkCount)} 条书签</span>
                  </div>
                </div>

                <Link
                  href={`/admin/bookmarks/categories/${category.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                >
                  编辑
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel text="还没有书签分类。" />
      )}
    </div>
  );
}
