"use client";

import { ContentStatus, StandalonePageNavGroup } from "@prisma/client";
import { ChevronDown, ChevronUp, Code2, FileText, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  discardStandalonePageRevisionAction,
  saveStandalonePageAction,
  type SaveStandalonePageEditorState,
} from "@/app/(admin)/admin/compose/page/actions";
import {
  deleteStandalonePageAction,
  unpublishStandalonePageAction,
} from "@/app/(admin)/admin/actions";
import { ContentEditorShell } from "@/app/(admin)/admin/compose/content-editor-shell";
import { ContentPreviewDialog } from "@/app/(admin)/admin/compose/content-preview-dialog";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { PublishedAtField } from "@/app/(admin)/admin/compose/post/published-at-field";
import { PostRichTextEditor } from "@/app/(admin)/admin/compose/post/post-rich-text-editor";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import { highlightCodeBlocksInHtml } from "@/lib/code-highlighting";
import { getRenderedContentHtml } from "@/lib/content";
import { parseStoredRichTextContent } from "@/lib/rich-text-content";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import type { StandalonePageItem } from "@/server/repositories/standalone-pages";

const initialState: SaveStandalonePageEditorState = {
  error: null,
  redirectTo: null,
  nonce: 0,
};

type StandalonePageEditorFormProps = {
  standalonePage: StandalonePageItem | null;
  siteUrlBase: string;
};

type StandalonePagePreviewState = {
  title: string;
  subtitle: string | null;
  meta: string;
  body: string;
};

export function StandalonePageEditorForm({
  standalonePage,
  siteUrlBase,
}: StandalonePageEditorFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveStandalonePageAction, initialState);
  const editablePage = getEditableStandalonePage(standalonePage);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(editablePage?.commentsEnabled ?? false);
  const [previewState, setPreviewState] = useState<StandalonePagePreviewState | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const wasDirtyBeforeSubmitRef = useRef(false);
  const draftSavedAt = getDraftSavedAt(standalonePage);
  const hasSavedRevision = Boolean(
    standalonePage?.status === ContentStatus.PUBLISHED && draftSavedAt,
  );
  const bottomPrompt = getBottomPrompt(standalonePage, draftSavedAt);
  const status = standalonePage?.status ?? ContentStatus.DRAFT;

  useUnsavedChangesWarning(isEditorDirty);

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  useEffect(() => {
    if (state.error && wasDirtyBeforeSubmitRef.current) {
      queueMicrotask(() => setIsEditorDirty(true));
    }
  }, [state.error, state.nonce]);

  return (
    <>
      <ContentEditorShell
        formRef={formRef}
        formAction={formAction}
        onSubmit={() => {
          wasDirtyBeforeSubmitRef.current = isEditorDirty;
          setIsEditorDirty(false);
        }}
        hiddenFields={
          <>
            <input type="hidden" name="standalonePageId" value={standalonePage?.id ?? ""} />
            <input type="hidden" name="currentStatus" value={status} />
            <input type="hidden" name="id" value={standalonePage?.id ?? ""} />
          </>
        }
        topBar={
          <div className="sticky top-[-1rem] z-30 -mx-4 -mt-4 border-b border-zinc-200/80 bg-white/92 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mt-6 md:top-[-1.5rem]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                  Editor
                </p>
                <h1 className="truncate text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
                  {standalonePage ? "编辑独立页面" : "新建独立页面"}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCodeView((current) => !current)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-[rgb(var(--primary-rgb)/0.06)] hover:text-primary dark:text-zinc-300 dark:hover:bg-[rgb(var(--primary-rgb)/0.1)] dark:hover:text-primary"
                  aria-label={isCodeView ? "切换到富文本" : "切换到源码"}
                  title={isCodeView ? "切换到富文本" : "切换到源码"}
                >
                  {isCodeView ? <FileText className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                </button>
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
                  {isSettingsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isSettingsOpen ? (
              <div className="border-t border-zinc-200/80 px-4 py-4 dark:border-zinc-800/80 md:px-6 md:py-5">
                <div className="grid gap-5">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_auto] md:items-start md:gap-6">
                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        发布日期
                      </span>
                      <PublishedAtField defaultValue={editablePage?.publishedAt} />
                    </label>
                    <label className="grid min-w-0 gap-2">
                      <input
                        type="checkbox"
                        name="commentsEnabled"
                        checked={commentsEnabled}
                        onChange={(event) => setCommentsEnabled(event.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        开启评论
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={commentsEnabled}
                        aria-label="开启评论"
                        onClick={() => setCommentsEnabled((current) => !current)}
                        className="relative inline-flex h-5 w-9 shrink-0 items-center"
                      >
                        <span
                          className={`absolute inset-0 rounded-full transition ${
                            commentsEnabled ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                          }`}
                        />
                        <span
                          className={`relative size-4 rounded-full bg-white shadow-sm transition-transform ${
                            commentsEnabled ? "translate-x-[1.125rem]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        导航位置
                      </span>
                      <select
                        name="navPlacement"
                        defaultValue={
                          editablePage?.showInNav
                            ? editablePage.navGroup === StandalonePageNavGroup.MORE
                              ? "more"
                              : "home"
                            : "none"
                        }
                        className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-200"
                      >
                        <option value="none">无</option>
                        <option value="home">首页</option>
                        <option value="more">更多</option>
                      </select>
                    </label>

                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        导航名称
                      </span>
                      <input
                        name="navLabel"
                        type="text"
                        defaultValue={editablePage?.navLabel ?? ""}
                        placeholder="留空时跟随标题"
                        className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-200"
                      />
                    </label>

                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        导航小标题
                      </span>
                      <input
                        name="navEyebrow"
                        type="text"
                        defaultValue={editablePage?.navEyebrow ?? ""}
                        placeholder="例如 About / Message"
                        className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-200"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        SEO 标题
                      </span>
                      <input
                        name="seoTitle"
                        type="text"
                        defaultValue={editablePage?.seoTitle ?? ""}
                        placeholder="留空时使用后台标题"
                        className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-sm text-zinc-700 outline-none transition focus:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-200"
                      />
                    </label>

                    <label className="grid min-w-0 gap-2">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                        SEO 描述
                      </span>
                      <textarea
                        name="seoDescription"
                        rows={2}
                        defaultValue={editablePage?.seoDescription ?? ""}
                        placeholder="可选，用于 metadata 描述。"
                        className="min-h-0 resize-none border-b border-zinc-200/80 bg-transparent px-0 py-2 text-sm text-zinc-700 outline-none transition focus:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-200"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        }
        stateError={state.error}
        main={
          <article className="grid gap-0">
            <div className="mx-auto grid w-full max-w-[64rem] gap-5 px-1 pb-2 pt-3 sm:px-2 sm:pb-3 sm:pt-4 2xl:max-w-[72rem]">
              <input
                name="title"
                type="text"
                required
                defaultValue={editablePage?.title ?? ""}
                placeholder="输入后台标题..."
                className="w-full bg-transparent px-0 text-[2rem] font-semibold tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600 sm:text-[2.7rem]"
              />

              <label className="grid gap-2">
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-3 text-sm text-zinc-500 transition focus-within:border-primary/45 dark:border-zinc-800/80 dark:text-zinc-400">
                  <span className="shrink-0 whitespace-nowrap">{siteUrlBase}/</span>
                  <input
                    name="slug"
                    type="text"
                    required
                    defaultValue={editablePage?.slug ?? ""}
                    placeholder="slug"
                    className="min-w-0 flex-1 bg-transparent px-0 text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
                  />
                </div>
              </label>
            </div>

            <div className="mx-auto w-full max-w-[64rem] px-1 pb-5 pt-4 sm:px-2 sm:pb-8 sm:pt-5 2xl:max-w-[72rem]">
              <PostRichTextEditor
                initialContent={editablePage?.content}
                initialContentHtml={editablePage?.contentHtml}
                onDirtyChange={setIsEditorDirty}
                placeholder="开始写独立页面正文。前台默认不会自动显示标题和摘要。"
                appearance="embedded"
                isCodeView={isCodeView}
                onCodeViewChange={setIsCodeView}
                showModeToggle={false}
              />
            </div>
          </article>
        }
        sidebar={null}
        sidebarMode="sticky"
        footerLeft={
          <>
            <p className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">{bottomPrompt}</p>
            {standalonePage && status === ContentStatus.PUBLISHED ? (
              <UnpublishButton standalonePageId={standalonePage.id} />
            ) : null}
            {standalonePage ? <TrashButton standalonePageId={standalonePage.id} /> : null}
            {hasSavedRevision ? (
              <DiscardRevisionButton standalonePageId={standalonePage?.id ?? 0} />
            ) : null}
          </>
        }
        footerRight={
          <>
            <PreviewButton
              onClick={() => setPreviewState(buildStandalonePagePreviewState(formRef.current))}
            />
            <SaveButton />
            <PublishButton isPublished={status === ContentStatus.PUBLISHED} />
          </>
        }
      />
      <ContentPreviewDialog
        open={Boolean(previewState)}
        title={previewState?.title ?? "预览"}
        subtitle={previewState?.subtitle}
        meta={previewState?.meta ? <span>{previewState.meta}</span> : null}
        body={
          <div
            className="reading-copy space-y-4 text-base leading-8 text-zinc-700 dark:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: previewState?.body ?? "" }}
          />
        }
        onOpenChange={(open) => {
          if (!open) {
            setPreviewState(null);
          }
        }}
      />
    </>
  );
}

function getBottomPrompt(page: StandalonePageItem | null, draftSavedAt: string | null) {
  if (!page) {
    return "当前是新独立页面。可以先保存为草稿，也可以直接发布。";
  }

  if (draftSavedAt) {
    return `当前正在编辑 ${formatAdminDateTime(draftSavedAt)} 保存的草稿，公开页仍在使用上一个已发布版本。`;
  }

  if (page.status === ContentStatus.PUBLISHED) {
    return "当前是已发布页面。保存会保留草稿，只有点击更新并发布才会更新公开页。";
  }

  return "当前是已保存的草稿。可以继续编辑，也可以直接发布。";
}

function getEditableStandalonePage(page: StandalonePageItem | null) {
  if (!page?.draftSnapshot) {
    return page;
  }

  return {
    ...page,
    title: page.draftSnapshot.title,
    slug: page.draftSnapshot.slug,
    content: page.draftSnapshot.content,
    contentHtml: page.draftSnapshot.contentHtml,
    publishedAt: page.draftSnapshot.publishedAt,
    commentsEnabled: page.draftSnapshot.commentsEnabled,
    showInNav: page.draftSnapshot.showInNav,
    navLabel: page.draftSnapshot.navLabel,
    navEyebrow: page.draftSnapshot.navEyebrow,
    navGroup: page.draftSnapshot.navGroup,
    seoTitle: page.draftSnapshot.seoTitle,
    seoDescription: page.draftSnapshot.seoDescription,
  };
}

function getDraftSavedAt(page: StandalonePageItem | null) {
  if (!page?.draftSnapshot) {
    return null;
  }

  return page.draftSnapshot.savedAt ?? null;
}

function buildStandalonePagePreviewState(
  form: HTMLFormElement | null,
): StandalonePagePreviewState | null {
  if (!form) {
    return null;
  }

  const formData = new FormData(form);
  const content = parseStoredRichTextContent(getFormValue(formData, "content"));
  const contentHtml = getFormValue(formData, "contentHtml") || null;
  const slug = getFormValue(formData, "slug");
  const body = highlightCodeBlocksInHtml(
    getRenderedContentHtml(contentHtml, content) ?? "<p>暂无内容。</p>",
  );

  return {
    title: "页面预览",
    subtitle: slug ? `/${slug}` : null,
    meta: "前台默认直接显示正文，不自动展示标题和摘要。",
    body: `<div class="reading-copy space-y-6 text-base leading-8 text-zinc-800 dark:text-zinc-200">${body}</div>`,
  };
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function PreviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-[0.95rem] border border-zinc-200/80 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      预览
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value="save"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[0.95rem] border border-zinc-200/80 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      {pending ? "保存中..." : "保存草稿"}
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
      className="inline-flex items-center justify-center rounded-[0.95rem] border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {pending ? "处理中..." : isPublished ? "更新并发布" : "发布页面"}
    </button>
  );
}

function DiscardRevisionButton({ standalonePageId }: { standalonePageId: number }) {
  return (
    <ConfirmActionDialog
      triggerLabel="删除修订"
      triggerClassName="inline-flex items-center justify-center rounded-[0.95rem] border border-rose-200/80 px-3 py-2 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-500 dark:border-rose-400/20 dark:text-rose-400 dark:hover:border-rose-400/30 dark:hover:text-rose-300"
      title="删除已保存修订？"
      description="删除后会回到当前已发布版本，未发布的页面改动不会保留。"
      confirmLabel="删除修订"
      confirmTone="danger"
      action={discardStandalonePageRevisionAction}
      fields={[{ name: "standalonePageId", value: standalonePageId }]}
    />
  );
}

function UnpublishButton({ standalonePageId }: { standalonePageId: number }) {
  return (
    <button
      type="submit"
      formAction={unpublishStandalonePageAction}
      className="inline-flex items-center justify-center rounded-[0.95rem] border border-zinc-200/80 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      转为草稿
    </button>
  );
}

function TrashButton({ standalonePageId }: { standalonePageId: number }) {
  return (
    <ConfirmActionDialog
      triggerLabel="移到回收站"
      triggerClassName="inline-flex items-center justify-center rounded-[0.95rem] border border-rose-200/80 px-3 py-2 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-500 dark:border-rose-400/20 dark:text-rose-400 dark:hover:border-rose-400/30 dark:hover:text-rose-300"
      title="将这个独立页面移到回收站？"
      description="移入回收站后不会立刻彻底删除，你可以稍后恢复到草稿，或者永久移除。"
      confirmLabel="移到回收站"
      confirmTone="danger"
      action={deleteStandalonePageAction}
      fields={[{ name: "id", value: standalonePageId }]}
    />
  );
}
