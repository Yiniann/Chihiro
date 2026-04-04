"use client";

import { ContentStatus } from "@prisma/client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  discardUpdateRevisionAction,
  saveUpdateAction,
  type SaveUpdateEditorState,
} from "@/app/(admin)/admin/compose/update/actions";
import { ContentEditorShell } from "@/app/(admin)/admin/compose/content-editor-shell";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { PublishedAtField } from "@/app/(admin)/admin/compose/post/published-at-field";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import type { UpdateItem } from "@/server/repositories/updates";

const initialState: SaveUpdateEditorState = {
  error: null,
  redirectTo: null,
};

type UpdateEditorFormProps = {
  update: UpdateItem | null;
};

export function UpdateEditorForm({ update }: UpdateEditorFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveUpdateAction, initialState);
  const editableUpdate = getEditableUpdate(update);
  const draftSavedAt = getDraftSavedAt(update);
  const hasSavedRevision = Boolean(update?.status === ContentStatus.PUBLISHED && draftSavedAt);
  const bottomPrompt = getBottomPrompt(update, draftSavedAt);
  const contentValue = typeof editableUpdate?.content === "string" ? editableUpdate.content : "";
  const status = update?.status ?? ContentStatus.DRAFT;

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  return (
    <ContentEditorShell
      formAction={formAction}
      hiddenFields={
        <>
          <input type="hidden" name="updateId" value={update?.id ?? ""} />
          <input type="hidden" name="currentStatus" value={status} />
        </>
      }
      stateError={state.error}
      main={
        <>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            动态只需要填写内容，标题会自动从内容生成。
          </p>

          <label className="grid gap-2">
            <textarea
              name="content"
              rows={16}
              defaultValue={contentValue}
              placeholder="先用纯文本写动态内容。保存时会按段落自动生成基础 HTML。"
              className="min-h-[22rem] border-none bg-transparent px-0 py-1 text-lg leading-9 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            />
          </label>
        </>
      }
      sidebar={
        <>
          <label className="grid gap-2 border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              发布日期
            </span>
            <PublishedAtField defaultValue={editableUpdate?.publishedAt} />
          </label>
        </>
      }
      footerLeft={
        <>
          <p className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">{bottomPrompt}</p>
          {hasSavedRevision ? <DiscardRevisionButton updateId={update?.id ?? 0} /> : null}
        </>
      }
      footerRight={
        <>
          <SaveButton />
          <PublishButton isPublished={status === ContentStatus.PUBLISHED} />
        </>
      }
    />
  );
}

function getBottomPrompt(update: UpdateItem | null, draftSavedAt: string | null) {
  if (!update) {
    return "当前是新撰写。可以先保存为草稿，也可以直接发布。";
  }

  if (draftSavedAt) {
    return `当前正在编辑 ${formatAdminDateTime(draftSavedAt)} 保存的草稿，公开页仍在使用上一个已发布版本。`;
  }

  if (update.status === ContentStatus.PUBLISHED) {
    return "当前是已发布动态。保存会保留草稿，只有点击更新并发布才会更新公开页。";
  }

  return "当前是已保存的草稿。可以继续编辑，也可以直接发布。";
}

function getEditableUpdate(update: UpdateItem | null) {
  if (!update?.draftSnapshot) {
    return update;
  }

  return {
    ...update,
    title: update.draftSnapshot.title,
    content: update.draftSnapshot.content,
    contentHtml: update.draftSnapshot.contentHtml,
    publishedAt: update.draftSnapshot.publishedAt,
  };
}

function getDraftSavedAt(update: UpdateItem | null) {
  if (!update?.draftSnapshot) {
    return null;
  }

  return update.draftSnapshot.savedAt ?? null;
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value="save"
      disabled={pending}
      className="inline-flex items-center justify-center border border-transparent bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? "保存中..." : "保存动态"}
    </button>
  );
}

function PublishButton({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value="publish"
      disabled={pending}
      className="inline-flex items-center justify-center border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
    >
      {pending ? "发布中..." : isPublished ? "更新并发布" : "发布动态"}
    </button>
  );
}

function DiscardRevisionButton({ updateId }: { updateId: number }) {
  return (
    <ConfirmActionDialog
      triggerLabel="删除修订"
      triggerClassName="inline-flex items-center border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      title="删除这条草稿？"
      description="删除后会恢复到上一个已发布版本，当前草稿内容会被丢弃。"
      confirmLabel="删除修订"
      action={discardUpdateRevisionAction}
      fields={[{ name: "updateId", value: updateId }]}
      confirmTone="danger"
    />
  );
}
