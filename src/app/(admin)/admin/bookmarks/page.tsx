import Link from "next/link";
import { Plus } from "lucide-react";
import { BookmarkActionMenu } from "@/app/(admin)/admin/bookmarks/bookmark-action-menu";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime, formatAdminNumber } from "@/app/(admin)/admin/utils";
import { getBookmarkKindLabel } from "@/lib/bookmarks";
import { listBookmarksForAdmin } from "@/server/repositories/bookmarks";

export default async function AdminBookmarksPage() {
  const bookmarks = await listBookmarksForAdmin();
  const visibleBookmarks = bookmarks.filter((item) => item.isVisible);
  const hiddenBookmarks = bookmarks.filter((item) => !item.isVisible);
  const featuredBookmarks = visibleBookmarks.filter((item) => item.isFeatured);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">书签管理</p>
          </div>

          <Link
            href="/admin/bookmarks/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            添加书签
          </Link>
          <Link
            href="/admin/bookmarks/categories"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            管理分类
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>全部 {formatAdminNumber(bookmarks.length)}</span>
          <span>显示中 {formatAdminNumber(visibleBookmarks.length)}</span>
          <span>已隐藏 {formatAdminNumber(hiddenBookmarks.length)}</span>
          <span>精选 {formatAdminNumber(featuredBookmarks.length)}</span>
        </div>
      </section>

      <BookmarkSection
        title="显示中的书签"
        items={visibleBookmarks}
        emptyText="当前没有显示中的书签。"
      />

      <BookmarkSection
        title="已隐藏的书签"
        items={hiddenBookmarks}
        emptyText="当前没有隐藏书签。"
      />
    </div>
  );
}

function BookmarkSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listBookmarksForAdmin>>;
  emptyText: string;
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-0">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 last:pb-0 dark:border-zinc-800/80"
            >
              <BookmarkListRow item={item} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel text={emptyText} />
      )}
    </section>
  );
}

function BookmarkListRow({
  item,
}: {
  item: Awaited<ReturnType<typeof listBookmarksForAdmin>>[number];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/bookmarks/${item.id}`}
            className="text-lg font-semibold text-zinc-950 transition hover:text-primary dark:text-zinc-50"
          >
            {item.title}
          </Link>
          {item.isFeatured ? (
            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[0.66rem] font-medium uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              Featured
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{item.category.name}</span>
          <span>{getBookmarkKindLabel(item.kind)}</span>
          <span>{item.host}</span>
          <span>排序 {item.sortOrder}</span>
          <span>{item.isVisible ? "显示中" : "已隐藏"}</span>
          <span>更新于 {formatAdminDateTime(item.updatedAt)}</span>
        </div>

        {item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200/80 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-[6.5rem] flex-col items-end gap-2">
        <BookmarkActionMenu
          bookmarkId={item.id}
          bookmarkUrl={item.url}
          hidden={!item.isVisible}
        />
      </div>
    </div>
  );
}
