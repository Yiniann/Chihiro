"use client";

import { useActionState, useEffect } from "react";
import {
  saveGeneralSettingsAction,
  type SaveGeneralSettingsState,
} from "@/app/(admin)/admin/settings/actions";
import { useToast } from "@/components/toast-provider";

const initialState: SaveGeneralSettingsState = {
  error: null,
  success: null,
};

type GeneralSettingsFormProps = {
  defaults: {
    siteName: string;
    siteUrl: string;
    heroIntro: string;
    summary: string;
    motto: string;
  };
  canEdit: boolean;
};

export function GeneralSettingsForm({ defaults, canEdit }: GeneralSettingsFormProps) {
  const [state, formAction] = useActionState(saveGeneralSettingsAction, initialState);
  useSettingsToast(state);

  return (
    <form id="general-settings-form" action={formAction} className="grid gap-6">
      <section className="grid gap-6 md:grid-cols-2">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            站点名
          </span>
          <input
            name="siteName"
            type="text"
            required
            defaultValue={defaults.siteName}
            className="h-11 bg-transparent px-0 text-xl tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-600"
            placeholder="输入站点名称"
          />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              主站点地址 (Canonical URL)
            </span>
            <input
              name="siteUrl"
              type="url"
              required
              defaultValue={defaults.siteUrl}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="https://example.com"
            />
            <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              对外的权威域名，用于登录回跳、SEO / RSS / sitemap / og:url。多域名部署请把其它域名在托管层 301 跳转到这里。
            </span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              首页介绍
            </span>
            <textarea
              name="heroIntro"
              rows={4}
              defaultValue={defaults.heroIntro}
              className="min-h-32 bg-transparent px-0 py-1 text-base leading-8 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="在首页作者名下方展示的介绍段落"
            />
            <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              支持换行形成多段；<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.72rem] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">{"{author}"}</code> 自动替换昵称；反引号包裹的内容（如 <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.72rem] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">`&lt;Developer /&gt;`</code>）会以打字机动画原样显示；<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.72rem] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">**xxx**</code> 加斜体强调。
            </span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              首页摘要
            </span>
            <textarea
              name="summary"
              rows={3}
              defaultValue={defaults.summary}
              className="min-h-28 bg-transparent px-0 py-1 text-base leading-8 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="在首页介绍下方的副文案"
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              座右铭
            </span>
            <textarea
              name="motto"
              rows={4}
              defaultValue={defaults.motto}
              className="min-h-32 bg-transparent px-0 py-1 text-base leading-8 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="写一句会出现在站点里的短句；需要分行时直接换行"
            />
          </label>
        </div>

      </section>

      <section className="grid gap-3">
        {!canEdit ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            只有 Owner 可以修改设置。
          </div>
        ) : null}
      </section>
    </form>
  );
}

function useSettingsToast(state: SaveGeneralSettingsState) {
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
    }
  }, [showToast, state.error, state.success]);
}
