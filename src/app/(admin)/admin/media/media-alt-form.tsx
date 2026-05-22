"use client";

import { useActionState } from "react";
import {
  saveMediaMetadataAction,
  type SaveMediaMetadataState,
} from "@/app/(admin)/admin/media/actions";

const INITIAL_STATE: SaveMediaMetadataState = {
  error: null,
  success: null,
  nonce: 0,
};

export function MediaMetadataForm({
  assetId,
  initialTitle,
  initialAlt,
}: {
  assetId: string;
  initialTitle: string | null;
  initialAlt: string | null;
}) {
  const [state, action] = useActionState(saveMediaMetadataAction, INITIAL_STATE);
  const formId = `media-metadata-form-${assetId}`;

  return (
    <form id={formId} action={action} className="grid gap-4">
      <input type="hidden" name="assetId" value={assetId} />
      <div className="grid gap-2">
        <label className="grid gap-2">
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            标题
          </span>
          <input
            type="text"
            name="title"
            defaultValue={initialTitle ?? ""}
            placeholder="给这条媒体起一个标题"
            className="h-11 border-b border-zinc-200 bg-transparent px-0 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            媒体描述
          </span>
          <input
            type="text"
            name="alt"
            defaultValue={initialAlt ?? ""}
            placeholder="描述这条媒体的内容"
            className="h-11 border-b border-zinc-200 bg-transparent px-0 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
        </label>
      </div>

      <div className="min-h-5 text-xs">
        {state.error ? (
          <p className="text-rose-600 dark:text-rose-400">{state.error}</p>
        ) : state.success ? (
          <p className="text-emerald-600 dark:text-emerald-400">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}
