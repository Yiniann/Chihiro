"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import {
  createBookmarkCategoryAction,
  deleteBookmarkCategoryAction,
  saveBookmarkCategoryAction,
  type SaveBookmarkCategoryEditorState,
} from "@/app/(admin)/admin/bookmarks/categories/actions";
import type { BookmarkCategoryItem } from "@/server/repositories/bookmark-categories";

const initialState: SaveBookmarkCategoryEditorState = {
  error: null,
  redirectTo: null,
  createdCategory: null,
  nonce: 0,
};

export function BookmarkCategoryEditorForm({ category }: { category?: BookmarkCategoryItem }) {
  const router = useRouter();
  const isCreateMode = !category;
  const [state, formAction] = useActionState(
    isCreateMode ? createBookmarkCategoryAction : saveBookmarkCategoryAction,
    initialState,
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className="grid gap-6">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <section className="grid gap-6">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            名称
          </span>
          <input
            name="name"
            type="text"
            required
            defaultValue={category?.name ?? ""}
            className="h-12 bg-transparent px-0 text-2xl font-semibold tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-600"
            placeholder="输入分类名称"
          />
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Slug
            </span>
            <input
              name="slug"
              type="text"
              required
              defaultValue={category?.slug ?? ""}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="例如: dev"
            />
          </label>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Eyebrow
            </span>
            <input
              name="eyebrow"
              type="text"
              defaultValue={category?.eyebrow ?? ""}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="例如: Frontend"
            />
          </label>
        </div>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            描述
          </span>
          <textarea
            name="description"
            rows={4}
            defaultValue={category?.description ?? ""}
            className="min-h-28 bg-transparent px-0 py-1 text-base leading-8 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="这个分类主要收什么类型的书签。"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            排序
          </span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={category?.sortOrder ?? 0}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition focus:outline-none dark:text-zinc-200"
          />
        </label>
      </section>

      {state.error ? <EmptyPanel text={state.error} /> : null}

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800/70 dark:bg-zinc-950/75 supports-[backdrop-filter]:dark:bg-zinc-950/65">
        <div className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
          {isCreateMode ? "创建后会跳到编辑页。" : `当前分类下有 ${category?.bookmarkCount ?? 0} 条书签。`}
        </div>
        <div className="flex items-center gap-2">
          {category ? <DeleteBookmarkCategoryButton category={category} /> : null}
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
      {pending ? "保存中..." : isCreateMode ? "创建分类" : "保存分类"}
    </button>
  );
}

function DeleteBookmarkCategoryButton({ category }: { category: BookmarkCategoryItem }) {
  return (
    <ConfirmActionDialog
      triggerLabel="删除分类"
      triggerClassName="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/50"
      title="删除这个书签分类？"
      description={
        category.bookmarkCount > 0
          ? "这个分类下还有书签，当前不能删除。请先调整这些书签的分类。"
          : "删除后无法撤销。"
      }
      confirmLabel="删除分类"
      action={deleteBookmarkCategoryAction}
      fields={[{ name: "id", value: category.id }]}
      confirmTone="danger"
      disabled={category.bookmarkCount > 0}
    />
  );
}
