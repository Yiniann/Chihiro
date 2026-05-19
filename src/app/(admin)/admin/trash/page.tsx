import {
  permanentlyDeleteTrashItemsBulkAction,
  restoreTrashItemsBulkAction,
} from "@/app/(admin)/admin/actions";
import { BulkSelectToggle } from "@/app/(admin)/admin/bulk-select-toggle";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import { TrashActionMenu } from "@/app/(admin)/admin/workbench/trash-action-menu";
import {
  filterTrashedAdminPosts,
  filterTrashedAdminStandalonePages,
  filterTrashedAdminUpdates,
} from "@/app/(admin)/admin/content-sections";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { listStandalonePagesForAdmin } from "@/server/repositories/standalone-pages";
import { listUpdatesForAdmin } from "@/server/repositories/updates";

type TrashItem = {
  key: string;
  kind: "post" | "update" | "page";
  id: number;
  title: string;
  updatedAt: string;
};

export default async function AdminTrashPage() {
  const [posts, updates, pages] = await Promise.all([
    listPostsForAdmin(),
    listUpdatesForAdmin(),
    listStandalonePagesForAdmin(),
  ]);
  const items: TrashItem[] = [
    ...filterTrashedAdminPosts(posts).map((item) => ({
      key: `post:${item.id}`,
      kind: "post" as const,
      id: item.id,
      title: item.title,
      updatedAt: item.updatedAt,
    })),
    ...filterTrashedAdminUpdates(updates).map((item) => ({
      key: `update:${item.id}`,
      kind: "update" as const,
      id: item.id,
      title: item.title,
      updatedAt: item.updatedAt,
    })),
    ...filterTrashedAdminStandalonePages(pages).map((item) => ({
      key: `page:${item.id}`,
      kind: "page" as const,
      id: item.id,
      title: item.title,
      updatedAt: item.updatedAt,
    })),
  ].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  return (
    <div className="grid gap-6">
      <section className="grid gap-2 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <p className="text-[14px] font-normal text-zinc-500">回收站</p>
        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          已移到回收站的文章、动态和独立页面会统一放在这里。你可以恢复到草稿，或者彻底删除。
        </p>
      </section>

      {items.length > 0 ? (
        <div className="bulk-selection-form grid gap-3">
          <form id="trash-bulk-form" />
          <div className="bulk-action-bar items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">已选内容后可批量恢复或彻底删除</p>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                form="trash-bulk-form"
                formAction={restoreTrashItemsBulkAction}
                className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20"
              >
                恢复
              </button>
              <button
                type="submit"
                form="trash-bulk-form"
                formAction={permanentlyDeleteTrashItemsBulkAction}
                className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
              >
                彻底删除
              </button>
            </div>
          </div>

          <section className="relative overflow-visible rounded-[1.5rem] border border-zinc-200/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="hidden border-b border-zinc-200/80 dark:border-white/10 lg:block">
              <div className="grid items-center gap-2 px-5 py-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 lg:grid-cols-[2.25rem_minmax(16rem,2.95fr)_5.25rem_7rem_4.5rem]">
                <div>
                  <BulkSelectToggle formId="trash-bulk-form" checkboxName="items" />
                </div>
                <div>标题</div>
                <div>类型</div>
                <div className="text-right">最后更新</div>
                <div>操作</div>
              </div>
            </div>

            <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
              {items.map((item) => (
                <article
                  key={item.key}
                  className="px-4 py-4 transition hover:bg-zinc-50/70 dark:hover:bg-white/[0.03] lg:px-5 lg:py-4"
                >
                  <div className="hidden items-center gap-2 lg:grid lg:grid-cols-[2.25rem_minmax(16rem,2.95fr)_5.25rem_7rem_4.5rem]">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="items"
                        value={item.key}
                        form="trash-bulk-form"
                        className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                        {item.title}
                      </p>
                    </div>
                    <div>
                      <TypeChip kind={item.kind} />
                    </div>
                    <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                      {formatAdminDateTime(item.updatedAt)}
                    </div>
                    <div className="justify-self-start">
                      <TrashActionMenu itemKey={item.key} itemLabel={getTrashItemLabel(item.kind)} />
                    </div>
                  </div>

                  <div className="lg:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                          {item.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                          <TypeChip kind={item.kind} />
                          <span>{formatAdminDateTime(item.updatedAt)}</span>
                        </div>
                      </div>
                      <TrashActionMenu
                        itemKey={item.key}
                        itemLabel={getTrashItemLabel(item.kind)}
                        compact
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <EmptyPanel text="回收站里还没有内容。" />
      )}
    </div>
  );
}

function TypeChip({ kind }: { kind: "post" | "update" | "page" }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
      {kind === "post" ? "文章" : kind === "update" ? "动态" : "独立页面"}
    </span>
  );
}

function getTrashItemLabel(kind: "post" | "update" | "page") {
  return kind === "post" ? "篇文章" : kind === "update" ? "条动态" : "个独立页面";
}
