"use client";

import { BookmarkKind } from "@prisma/client";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import {
  createBookmarkAction,
  deleteBookmarkAction,
  saveBookmarkAction,
  type SaveBookmarkEditorState,
} from "@/app/(admin)/admin/bookmarks/actions";
import { bookmarkKindOptions, formatBookmarkTags } from "@/lib/bookmarks";
import type { BookmarkCategoryItem } from "@/server/repositories/bookmark-categories";
import type { BookmarkItem } from "@/server/repositories/bookmarks";

const initialState: SaveBookmarkEditorState = {
  error: null,
  redirectTo: null,
  createdBookmark: null,
  nonce: 0,
};

export function BookmarkEditorForm({
  bookmark,
  categories,
}: {
  bookmark?: BookmarkItem;
  categories: BookmarkCategoryItem[];
}) {
  const router = useRouter();
  const isCreateMode = !bookmark;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(bookmark?.isVisible ?? true);
  const [isFeatured, setIsFeatured] = useState(bookmark?.isFeatured ?? false);
  const [state, formAction] = useActionState(
    isCreateMode ? createBookmarkAction : saveBookmarkAction,
    initialState,
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className="grid gap-6">
      {bookmark ? <input type="hidden" name="id" value={bookmark.id} /> : null}

      <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 border-b border-zinc-200/80 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
              Editor
            </p>
            <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
              {isCreateMode ? "添加书签" : "编辑书签"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((current) => !current)}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
              isSettingsOpen
                ? "bg-primary/10 text-primary dark:bg-primary/15"
                : "text-zinc-500 hover:bg-[rgb(var(--primary-rgb)/0.06)] hover:text-primary dark:text-zinc-300 dark:hover:bg-[rgb(var(--primary-rgb)/0.1)] dark:hover:text-primary"
            }`}
            aria-expanded={isSettingsOpen}
            aria-label={isSettingsOpen ? "收起设置" : "展开设置"}
            title={isSettingsOpen ? "收起设置" : "更多设置"}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{isSettingsOpen ? "收起设置" : "更多设置"}</span>
            {isSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={`${isSettingsOpen ? "block" : "hidden"} border-t border-zinc-200/80 px-4 py-4 dark:border-zinc-800/80 md:px-6 md:py-5`}
        >
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  分类
                </span>
                <select
                  name="categoryId"
                  defaultValue={bookmark?.category.id ?? categories[0]?.id ?? ""}
                  className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/50 dark:border-zinc-800/80 dark:text-zinc-200"
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  类型
                </span>
                <select
                  name="kind"
                  defaultValue={bookmark?.kind ?? BookmarkKind.ARTICLE}
                  className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/50 dark:border-zinc-800/80 dark:text-zinc-200"
                >
                  {bookmarkKindOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem]">
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  排序
                </span>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={bookmark?.sortOrder ?? 0}
                  className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/50 dark:border-zinc-800/80 dark:text-zinc-200"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={isVisible}
                  onChange={(event) => setIsVisible(event.target.checked)}
                  className="sr-only"
                />
                <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  前台可见
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVisible}
                  aria-label="前台可见"
                  onClick={() => setIsVisible((current) => !current)}
                  className="relative inline-flex h-5 w-9 shrink-0 items-center"
                >
                  <span
                    className={`absolute inset-0 rounded-full transition ${
                      isVisible ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                  <span
                    className={`relative size-4 rounded-full bg-white shadow-sm transition-transform ${
                      isVisible ? "translate-x-[1.125rem]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <label className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="sr-only"
                />
                <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  精选展示
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeatured}
                  aria-label="精选展示"
                  onClick={() => setIsFeatured((current) => !current)}
                  className="relative inline-flex h-5 w-9 shrink-0 items-center"
                >
                  <span
                    className={`absolute inset-0 rounded-full transition ${
                      isFeatured ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                  <span
                    className={`relative size-4 rounded-full bg-white shadow-sm transition-transform ${
                      isFeatured ? "translate-x-[1.125rem]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-6">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            标题
          </span>
          <input
            name="title"
            type="text"
            required
            defaultValue={bookmark?.title ?? ""}
            className="h-12 bg-transparent px-0 text-2xl font-semibold tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-600"
            placeholder="例如：MDN Web Docs"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            链接
          </span>
          <input
            name="url"
            type="text"
            required
            defaultValue={bookmark?.url ?? ""}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="https://example.com"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            摘要
          </span>
          <textarea
            name="summary"
            required
            rows={3}
            defaultValue={bookmark?.summary ?? ""}
            className="resize-none bg-transparent px-0 text-base leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="简短说明这个书签为什么值得收藏。"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            标签
          </span>
          <input
            name="tags"
            type="text"
            defaultValue={bookmark ? formatBookmarkTags(bookmark.tags) : ""}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="React, Docs, Performance"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            备注
          </span>
          <textarea
            name="note"
            rows={3}
            defaultValue={bookmark?.note ?? ""}
            className="resize-none bg-transparent px-0 text-base leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="补充适合什么时候打开它，或你自己的使用建议。"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Logo 覆盖地址
          </span>
          <input
            name="logoOverrideUrl"
            type="text"
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="可选。留空时自动抓取站点 icon。"
          />
          <span className="text-xs leading-6 text-zinc-400 dark:text-zinc-500">
            保存时会优先抓这个地址，并把结果缓存到书签记录里；留空则自动从站点 icon、manifest、常见路径和分享图里尝试。
          </span>
        </label>

      </section>

      {state.error ? <EmptyPanel text={state.error} /> : null}

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800/70 dark:bg-zinc-950/75 supports-[backdrop-filter]:dark:bg-zinc-950/65">
        <div className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
          {isCreateMode ? "创建后会回到书签列表。" : "保存后会回到书签列表。"}
        </div>
        <div className="flex items-center gap-2">
          {bookmark ? <DeleteBookmarkButton bookmarkId={bookmark.id} /> : null}
          <SaveButton isCreateMode={isCreateMode} />
        </div>
      </div>
    </form>
  );
}

function SaveButton({ isCreateMode }: { isCreateMode: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center border border-transparent bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? "保存中..." : isCreateMode ? "创建书签" : "保存书签"}
    </button>
  );
}

function DeleteBookmarkButton({ bookmarkId }: { bookmarkId: number }) {
  return (
    <ConfirmActionDialog
      triggerLabel="删除书签"
      triggerClassName="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/50"
      title="删除这个书签？"
      description="删除后无法撤销，这个链接会立刻从后台和前台移除。"
      confirmLabel="删除书签"
      action={deleteBookmarkAction}
      fields={[{ name: "id", value: bookmarkId }]}
      confirmTone="danger"
    />
  );
}
