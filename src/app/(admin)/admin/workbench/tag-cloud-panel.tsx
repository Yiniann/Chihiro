"use client";

import Link from "next/link";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { deleteTagAction } from "@/app/(admin)/admin/tags/actions";

type TagCloudItem = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  contentCount: number;
};

type TagCloudPanelProps = {
  items: TagCloudItem[];
};

export function TagCloudPanel({ items }: TagCloudPanelProps) {
  return (
    <section className="border-b border-zinc-200/80 pb-6 dark:border-zinc-800/80">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <Link
          href="/admin/tags/new"
          className="inline-flex items-center gap-1.5 border-b border-transparent px-0 py-1 text-sm font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        >
          增加标签
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {items.map((item, index) => (
            <div key={item.id} className="group relative inline-flex items-center">
              <Link
                href={`/admin/tags/${item.id}`}
                className={[
                  "inline-flex items-center rounded-md border py-1.5 pl-3 pr-8 text-sm font-medium transition",
                  index % 5 === 0
                    ? "border-zinc-300/80 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-50 dark:hover:bg-zinc-900/80"
                    : index % 5 === 1
                      ? "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                      : index % 5 === 2
                        ? "border-zinc-200/80 bg-zinc-50/80 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-900/80"
                        : index % 5 === 3
                          ? "border-zinc-300/70 bg-zinc-100/70 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700/70 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                          : "border-zinc-200/80 bg-white/90 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-400 dark:hover:bg-zinc-900/60",
                ].join(" ")}
              >
                {item.name}
              </Link>
                <ConfirmActionDialog
                  triggerLabel="×"
                  triggerClassName="absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-transparent text-xs font-semibold text-zinc-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 group-focus-within:opacity-100 dark:text-zinc-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                title={`删除标签「${item.name}」？`}
                description="删除后无法撤销，已关联的文章会保留，但标签关联会被移除。"
                confirmLabel="删除标签"
                action={deleteTagAction}
                fields={[{ name: "id", value: item.id }]}
                confirmTone="danger"
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel text="还没有标签。" />
      )}
    </section>
  );
}
