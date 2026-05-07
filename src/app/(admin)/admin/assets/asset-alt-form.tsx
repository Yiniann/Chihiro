"use client";

import { useActionState } from "react";
import { saveAssetAltAction, type SaveAssetAltState } from "@/app/(admin)/admin/assets/actions";

const INITIAL_STATE: SaveAssetAltState = {
  error: null,
  success: null,
};

export function AssetAltForm({
  assetId,
  initialAlt,
}: {
  assetId: string;
  initialAlt: string | null;
}) {
  const [state, action, isPending] = useActionState(saveAssetAltAction, INITIAL_STATE);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="assetId" value={assetId} />
      <label className="grid gap-2">
        <span className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          图片描述
        </span>
        <input
          type="text"
          name="alt"
          defaultValue={initialAlt ?? ""}
          placeholder="描述这张图片的内容"
          className="h-11 rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-progress disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {isPending ? "保存中…" : "保存描述"}
        </button>
        {state.error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{state.error}</p>
        ) : state.success ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}
