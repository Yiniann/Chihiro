"use client";

import { ContentStatus } from "@prisma/client";
import { ChevronDown, ChevronUp, Code2, FileText, Pencil, SlidersHorizontal } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  discardUpdateRevisionAction,
  saveUpdateAction,
  type SaveUpdateEditorState,
} from "@/app/(admin)/admin/compose/update/actions";
import { HiddenField, KindMetadataFields } from "@/app/(admin)/admin/compose/update/update-kind-search-fields";
import { ContentEditorShell } from "@/app/(admin)/admin/compose/content-editor-shell";
import { ContentPreviewDialog } from "@/app/(admin)/admin/compose/content-preview-dialog";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { PublishedAtField } from "@/app/(admin)/admin/compose/post/published-at-field";
import { UpdateSelectionStepper } from "@/app/(admin)/admin/updates/update-selection-stepper";
import { PostRichTextEditor } from "@/app/(admin)/admin/compose/post/post-rich-text-editor";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import { DialogShell } from "@/components/dialog-shell";
import { UpdateKindPreviewCard } from "@/components/update-kind-preview-card";
import { highlightCodeBlocksInHtml } from "@/lib/code-highlighting";
import { getRenderedContentHtml } from "@/lib/content";
import {
  getUpdateKindLabel,
  type UpdateMetadata,
  type UpdateKindValue,
} from "@/lib/update-kind";
import { getRichTextPreviewTitle, parseStoredRichTextContent } from "@/lib/rich-text-content";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import type { UpdateItem } from "@/server/repositories/updates";

const initialState: SaveUpdateEditorState = {
  error: null,
  redirectTo: null,
  nonce: 0,
};

type UpdateEditorFormProps = {
  update: UpdateItem | null;
  authorName: string;
  initialKind?: UpdateKindValue;
  initialMetadata?: UpdateItem["metadata"] | null;
  initialPublishedAt?: string | null;
};

type UpdatePreviewState = {
  title: string;
  subtitle: string | null;
  meta: string;
  body: string;
};

export function UpdateEditorForm({
  update,
  authorName,
  initialKind,
  initialMetadata,
  initialPublishedAt,
}: UpdateEditorFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveUpdateAction, initialState);
  const editableUpdate = getEditableUpdate(update);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [previewState, setPreviewState] = useState<UpdatePreviewState | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [selectedKind, setSelectedKind] = useState<UpdateKindValue>(editableUpdate?.kind ?? initialKind ?? "NOTE");
  const [metadata, setMetadata] = useState<UpdateMetadata>(
    editableUpdate?.metadata ?? initialMetadata ?? { kind: "NOTE", data: null },
  );
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<"choose" | "details">("choose");
  const [draftKind, setDraftKind] = useState<UpdateKindValue>(editableUpdate?.kind ?? initialKind ?? "NOTE");
  const [draftMetadata, setDraftMetadata] = useState<UpdateMetadata>(
    editableUpdate?.metadata ?? initialMetadata ?? { kind: "NOTE", data: null },
  );
  const wasDirtyBeforeSubmitRef = useRef(false);
  const draftSavedAt = getDraftSavedAt(update);
  const hasSavedRevision = Boolean(update?.status === ContentStatus.PUBLISHED && draftSavedAt);
  const bottomPrompt = getBottomPrompt(update, draftSavedAt);
  const status = update?.status ?? ContentStatus.DRAFT;

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
            <input type="hidden" name="updateId" value={update?.id ?? ""} />
            <input type="hidden" name="currentStatus" value={status} />
            <MetadataHiddenFields kind={selectedKind} metadata={metadata} />
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
                  {update ? "编辑动态" : "撰写新动态"}
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
                  {isSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div
              className={`border-t border-zinc-200/80 px-4 py-4 dark:border-zinc-800/80 md:px-6 md:py-5 ${
                isSettingsOpen ? "block" : "hidden"
              }`}
            >
                <div className="max-w-xs">
                  <label className="grid min-w-0 gap-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                      发布日期
                    </span>
                    <PublishedAtField defaultValue={editableUpdate?.publishedAt ?? initialPublishedAt ?? null} />
                  </label>
                </div>
            </div>

            <div className="border-t border-zinc-200/80 px-4 py-4 dark:border-zinc-800/80 md:px-6">
              <UpdateSelectionPreview
                kind={selectedKind}
                metadata={metadata}
                onEdit={() => {
                  setDraftKind(selectedKind);
                  setDraftMetadata(metadata);
                  setSelectionStep(selectedKind === "NOTE" ? "choose" : "details");
                  setIsSelectionDialogOpen(true);
                }}
              />
            </div>
          </div>
        }
        stateError={state.error}
        main={
          <article className="grid gap-0">
            <div className="mx-auto w-full max-w-[64rem] px-1 pb-5 pt-3 sm:px-2 sm:pb-8 sm:pt-4 2xl:max-w-[72rem]">
              <PostRichTextEditor
                initialContent={editableUpdate?.content}
                initialContentHtml={editableUpdate?.contentHtml}
                onDirtyChange={setIsEditorDirty}
                placeholder={getEditorPlaceholder(selectedKind)}
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
            {hasSavedRevision ? <DiscardRevisionButton updateId={update?.id ?? 0} /> : null}
          </>
        }
        footerRight={
          <>
            <PreviewButton
              onClick={() => setPreviewState(buildUpdatePreviewState(formRef.current, authorName, selectedKind))}
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
      <DialogShell
        open={isSelectionDialogOpen}
        onOpenChange={setIsSelectionDialogOpen}
        title="修改动态内容"
        eyebrow="Update Selection"
        maxWidthClassName="max-w-4xl"
        widthClassName="w-fit"
      >
        <UpdateSelectionStepper
          step={selectionStep}
          selectedKind={draftKind}
          backLabel="其他动态类型"
          onSelectKind={(nextKind) => {
            if (nextKind === "NOTE") {
              setDraftKind("NOTE");
              setDraftMetadata({ kind: "NOTE", data: null });
              setSelectedKind("NOTE");
              setMetadata({ kind: "NOTE", data: null });
              setIsEditorDirty(true);
              setIsSelectionDialogOpen(false);
              return;
            }

            setDraftKind(nextKind);
            setDraftMetadata(
              nextKind === draftKind ? draftMetadata : createEmptyMetadata(nextKind),
            );
            setSelectionStep("details");
          }}
          onBack={() => setSelectionStep("choose")}
        >
          <KindMetadataFields
            kind={draftKind}
            metadata={draftMetadata}
            onMetadataChange={(nextMetadata) => {
              setDraftMetadata(nextMetadata);
            }}
            onDirty={() => undefined}
            searchActionLabel={draftKind === "MOVIE" || draftKind === "MUSIC" ? "搜索" : undefined}
            onMovieSelect={(nextMovieMetadata) => {
              setDraftKind("MOVIE");
              setDraftMetadata({ kind: "MOVIE", data: nextMovieMetadata });
              setSelectedKind("MOVIE");
              setMetadata({ kind: "MOVIE", data: nextMovieMetadata });
              setIsEditorDirty(true);
              setIsSelectionDialogOpen(false);
            }}
            onMusicSelect={(nextMusicMetadata) => {
              setDraftKind("MUSIC");
              setDraftMetadata({ kind: "MUSIC", data: nextMusicMetadata });
              setSelectedKind("MUSIC");
              setMetadata({ kind: "MUSIC", data: nextMusicMetadata });
              setIsEditorDirty(true);
              setIsSelectionDialogOpen(false);
            }}
          />

          {draftKind === "OBJECT" ? (
            <div className="mt-6 flex items-center justify-end gap-5">
              <button
                type="button"
                onClick={() => setIsSelectionDialogOpen(false)}
                className="inline-flex h-10 items-center justify-center text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedKind(draftKind);
                  setMetadata(draftMetadata);
                  setIsEditorDirty(true);
                  setIsSelectionDialogOpen(false);
                }}
                className="inline-flex h-10 items-center justify-center rounded-2xl px-1 text-sm font-medium text-primary transition hover:opacity-80"
              >
                确认
              </button>
            </div>
          ) : null}
        </UpdateSelectionStepper>
      </DialogShell>
    </>
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
    kind: update.draftSnapshot.kind,
    content: update.draftSnapshot.content,
    contentHtml: update.draftSnapshot.contentHtml,
    metadata: update.draftSnapshot.metadata,
    publishedAt: update.draftSnapshot.publishedAt,
  };
}

function getDraftSavedAt(update: UpdateItem | null) {
  if (!update?.draftSnapshot) {
    return null;
  }

  return update.draftSnapshot.savedAt ?? null;
}

function getEditorPlaceholder(kind: UpdateKindValue) {
  if (kind === "MOVIE") {
    return "先写你对这部电影的短评。电影信息卡在设置里填写或后面接入自动补全。";
  }

  if (kind === "MUSIC") {
    return "先写这次想分享的听感。音乐卡字段可以在设置里填写，后面会接 Apple Music 自动补全。";
  }

  if (kind === "OBJECT") {
    return "先写这件物品为什么值得分享。卡片摘要和头图信息在设置里填写。";
  }

  return "开始写这条动态。支持标题、引用、链接和图片。";
}

function buildUpdatePreviewState(
  form: HTMLFormElement | null,
  authorName: string,
  kind: UpdateKindValue,
): UpdatePreviewState | null {
  if (!form) {
    return null;
  }

  const formData = new FormData(form);
  const content = parseStoredRichTextContent(getFormValue(formData, "content"));
  const contentHtml = getFormValue(formData, "contentHtml") || null;
  const publishedAt = getFormValue(formData, "publishedAt");
  const title = getRichTextPreviewTitle(contentHtml, content, "未命名动态");
  const body = highlightCodeBlocksInHtml(contentHtml ?? getRenderedContentHtml(null, content) ?? "<p>暂无内容。</p>");
  const formattedPublishedAt = publishedAt ? formatAdminDateTime(publishedAt) : null;

  return {
    title,
    subtitle: `${getUpdateKindLabel(kind)}预览`,
    meta: [authorName, formattedPublishedAt ? `发布时间：${formattedPublishedAt}` : "未设置发布时间"].join(" · "),
    body: `
      <div class="reading-copy space-y-6 text-base leading-8 text-zinc-800 dark:text-zinc-200">
        ${body}
      </div>
    `,
  };
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="intent"
      value="save"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center px-1 text-sm font-medium text-primary transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
      className="inline-flex h-10 w-full items-center justify-center px-1 text-[0.98rem] font-semibold text-primary underline decoration-1 underline-offset-4 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "发布中..." : isPublished ? "更新并发布" : "发布动态"}
    </button>
  );
}

function DiscardRevisionButton({ updateId }: { updateId: number }) {
  return (
    <ConfirmActionDialog
      triggerLabel="删除修订"
      triggerClassName="inline-flex h-8 w-full items-center justify-center rounded-full border border-transparent px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10 sm:w-auto"
      title="删除这条草稿？"
      description="删除后会恢复到上一个已发布版本，当前草稿内容会被丢弃。"
      confirmLabel="删除修订"
      action={discardUpdateRevisionAction}
      fields={[{ name: "updateId", value: updateId }]}
      confirmTone="danger"
    />
  );
}

function PreviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-full items-center justify-center px-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:w-auto"
    >
      预览
    </button>
  );
}

function UpdateSelectionPreview({
  kind,
  metadata,
  onEdit,
}: {
  kind: UpdateKindValue;
  metadata: UpdateMetadata;
  onEdit: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          动态内容
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-2 rounded-full text-sm font-medium text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Pencil className="h-4 w-4" />
          修改
        </button>
      </div>

      {kind === "NOTE" ? (
        <div className="rounded-[1.6rem] border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Note
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">普通动态</p>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            这条动态不附带电影、音乐或物品对象卡片。
          </p>
        </div>
      ) : (
        <UpdateKindPreviewCard kind={kind} metadata={metadata} interactive={false} />
      )}
    </div>
  );
}

function MetadataHiddenFields({ kind, metadata }: { kind: UpdateKindValue; metadata: UpdateMetadata }) {
  return (
    <>
      <HiddenField name="updateKind" value={kind} />
      <HiddenField name="updateMetadataJson" value={JSON.stringify(metadata)} />
      {kind === "MOVIE" && metadata.kind === "MOVIE" ? (
        <>
          <HiddenField name="movieTitle" value={metadata.data.title} />
          <HiddenField name="movieOriginalTitle" value={metadata.data.originalTitle} />
          <HiddenField name="movieYear" value={metadata.data.year} />
          <HiddenField name="moviePosterUrl" value={metadata.data.posterUrl} />
          <HiddenField name="movieDirector" value={metadata.data.director} />
          <HiddenField name="movieGenres" value={metadata.data.genres.join(", ")} />
          <HiddenField name="movieOverview" value={metadata.data.overview} />
          <HiddenField name="movieRating" value={metadata.data.rating} />
          <HiddenField name="movieSourceName" value={metadata.data.sourceName} />
          <HiddenField name="movieSourceUrl" value={metadata.data.sourceUrl} />
        </>
      ) : null}
      {kind === "MUSIC" && metadata.kind === "MUSIC" ? (
        <>
          <HiddenField name="musicFormat" value={metadata.data.format} />
          <HiddenField name="musicTitle" value={metadata.data.title} />
          <HiddenField name="musicArtist" value={metadata.data.artist} />
          <HiddenField name="musicAlbum" value={metadata.data.album} />
          <HiddenField name="musicReleaseYear" value={metadata.data.releaseYear} />
          <HiddenField name="musicCoverUrl" value={metadata.data.coverUrl} />
          <HiddenField name="musicGenres" value={metadata.data.genres.join(", ")} />
          <HiddenField name="musicAppleMusicId" value={metadata.data.appleMusicId} />
          <HiddenField name="musicAppleMusicUrl" value={metadata.data.appleMusicUrl} />
          <HiddenField name="musicListeningNote" value={metadata.data.listeningNote} />
        </>
      ) : null}
      {kind === "OBJECT" && metadata.kind === "OBJECT" ? (
        <>
          <HiddenField name="objectTitle" value={metadata.data.title} />
          <HiddenField name="objectSlug" value={metadata.data.slug} />
          <HiddenField name="objectBrand" value={metadata.data.brand} />
          <HiddenField name="objectModel" value={metadata.data.model} />
          <HiddenField name="objectCategory" value={metadata.data.category} />
          <HiddenField name="objectHeroImage" value={metadata.data.heroImage} />
          <HiddenField name="objectSummary" value={metadata.data.summary} />
        </>
      ) : null}
    </>
  );
}

function createEmptyMetadata(kind: UpdateKindValue): UpdateMetadata {
  if (kind === "MOVIE") {
    return {
      kind,
      data: {
        title: "",
        originalTitle: null,
        year: null,
        posterUrl: null,
        director: null,
        genres: [],
        overview: null,
        rating: null,
        sourceName: null,
        sourceUrl: null,
      },
    };
  }

  if (kind === "MUSIC") {
    return {
      kind,
      data: {
        format: null,
        title: "",
        artist: null,
        album: null,
        releaseYear: null,
        coverUrl: null,
        genres: [],
        appleMusicId: null,
        appleMusicUrl: null,
        listeningNote: null,
      },
    };
  }

  if (kind === "OBJECT") {
    return {
      kind,
      data: {
        title: "",
        slug: null,
        heroImage: null,
        brand: null,
        model: null,
        category: null,
        summary: null,
        detailPath: null,
      },
    };
  }

  return { kind: "NOTE", data: null };
}
