"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setProjectVisibilityBulkAction } from "@/app/(admin)/admin/projects/actions";
import { useToast } from "@/components/toast-provider";

export function ProjectBulkActionBar({
  formId,
  hidden,
}: {
  formId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bulk-action-bar items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">已选项目后可直接批量操作</p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const form = document.getElementById(formId) as HTMLFormElement | null;

          if (!form) {
            return;
          }

          const formData = new FormData(form);
          const count = formData.getAll("projectSlugs").length;

          if (count === 0) {
            return;
          }

          startTransition(async () => {
            await setProjectVisibilityBulkAction(formData);
            showToast(hidden ? `已恢复显示 ${count} 个项目` : `已隐藏 ${count} 个项目`);
            router.refresh();
          });
        }}
        className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20"
      >
        {isPending ? "处理中..." : hidden ? "恢复显示" : "隐藏项目"}
      </button>
    </div>
  );
}
