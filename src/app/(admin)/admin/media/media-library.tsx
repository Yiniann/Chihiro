"use client";

import Link from "next/link";
import { ExternalLink, ImageIcon, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmActionDialog } from "@/app/(admin)/admin/confirm-action-dialog";
import { removeMediaRecordAction } from "@/app/(admin)/admin/media/actions";
import { MediaMetadataForm } from "@/app/(admin)/admin/media/media-alt-form";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import type {
  AssetItem,
  AssetUsageReference,
  AssetUsageSummary,
} from "@/server/repositories/assets";

type MediaAssetItem = AssetItem & {
  usageSummary: AssetUsageSummary;
  usageReferences: AssetUsageReference[];
};

const mediaTypeFilters: Array<{
  label: string;
  value: AssetItem["kind"] | null;
}> = [
  { label: "全部", value: null },
  { label: "图片", value: "IMAGE" },
  { label: "视频", value: "VIDEO" },
  { label: "文件", value: "FILE" },
];

export function MediaLibrary({ assets }: { assets: MediaAssetItem[] }) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetItem["kind"] | null>(null);
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesQuery =
        !normalizedQuery ||
        [asset.title, asset.alt, asset.url]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesType = typeFilter === null || asset.kind === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [assets, deferredQuery, typeFilter]);
  const searchTerms = useMemo(() => getSearchTerms(deferredQuery.trim().toLowerCase()), [deferredQuery]);
  const selectedAsset = useMemo(
    () =>
      filteredAssets.find((asset) => asset.id === selectedAssetId) ??
      assets.find((asset) => asset.id === selectedAssetId) ??
      null,
    [assets, filteredAssets, selectedAssetId],
  );

  useEffect(() => {
    if (!selectedAsset && !isSearchOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAssetId(null);
        setIsSearchOpen(false);
      }
    };

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    if (isSearchOpen) {
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSearchOpen, selectedAsset]);

  if (assets.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200/80 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        还没有已上传媒体。
      </div>
    );
  }

  return (
    <>
      <section className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {mediaTypeFilters.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setTypeFilter(item.value)}
                className={[
                  "inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium transition",
                  item.value === typeFilter
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-primary dark:text-zinc-400"
          >
            <Search className="h-4 w-4" />
            <span>搜索媒体</span>
          </button>
        </div>

        {filteredAssets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className="group overflow-hidden border border-zinc-200/80 bg-white/72 text-left transition hover:border-zinc-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)] dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:hover:border-zinc-700 dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.24)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.alt ?? ""}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {asset.title?.trim() || getUntitledMediaLabel(asset.kind)}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {formatAdminDateTime(asset.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200/80 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
                    {getMediaTypeLabel(asset.kind)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200/80 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
            没找到匹配的媒体记录。
          </div>
        )}
      </section>

      {selectedAsset && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] overflow-y-auto bg-zinc-950/45 backdrop-blur-md dark:bg-black/65"
              onClick={() => setSelectedAssetId(null)}
            >
              <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="媒体详情"
                  className="grid w-full max-w-6xl overflow-hidden border border-zinc-200/80 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.2)] dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-[0_30px_120px_rgba(0,0,0,0.55)] lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.9fr)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative flex min-h-[18rem] items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-900 sm:p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedAsset.url}
                      alt={selectedAsset.alt ?? ""}
                      className="max-h-[72vh] w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col border-t border-zinc-200/80 dark:border-zinc-800/80 lg:border-l lg:border-t-0">
                    <div className="border-b border-zinc-200/80 px-5 py-5 dark:border-zinc-800/80 sm:px-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                            Media
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 px-2.5 py-1 dark:border-zinc-800/80">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {getMediaTypeLabel(selectedAsset.kind)}
                            </span>
                            <span>上传于 {formatAdminDateTime(selectedAsset.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="关闭媒体详情"
                          onClick={() => setSelectedAssetId(null)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 px-5 py-5 sm:px-6">
                      <div className="grid gap-3">
                        <MediaMetadataForm
                          assetId={selectedAsset.id}
                          initialTitle={selectedAsset.title}
                          initialAlt={selectedAsset.alt}
                        />
                      </div>

                      <InfoBlock label="URL" value={selectedAsset.url} mono dashed />
                      <InfoBlock
                        label="拍摄信息"
                        value={selectedAsset.photoMeta ?? "未解析到拍摄信息"}
                        dashed
                      />
                      {selectedAsset.usageSummary.totalCount > 0 ? (
                        <UsageBlock references={selectedAsset.usageReferences} />
                      ) : null}
                    </div>

                    <div className="mt-auto border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80 sm:px-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="group/remove relative inline-flex">
                          <ConfirmActionDialog
                            triggerLabel="移除媒体库"
                            triggerClassName="inline-flex h-10 items-center justify-center px-1 text-sm font-medium text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:text-rose-300 dark:text-rose-300 dark:hover:text-rose-200 dark:disabled:text-rose-800"
                            title="移除这条媒体记录？"
                            description={
                              selectedAsset.usageSummary.totalCount > 0
                                ? getMediaUsageDescription(selectedAsset.usageSummary)
                                : "这只会删除媒体库里的记录，不会删除原始媒体文件或对象存储里的内容。"
                            }
                            confirmLabel="确认移除"
                            confirmTone="danger"
                            disabled={selectedAsset.usageSummary.totalCount > 0}
                            action={removeMediaRecordAction}
                            fields={[{ name: "assetId", value: selectedAsset.id }]}
                          />
                          {selectedAsset.usageSummary.totalCount > 0 ? (
                            <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-2xl bg-zinc-950 px-3 py-2 text-xs leading-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.28)] group-hover/remove:block dark:bg-zinc-100 dark:text-zinc-950">
                              {getMediaUsageDescription(selectedAsset.usageSummary)}
                            </span>
                          ) : null}
                        </span>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={selectedAsset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-2 px-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                            打开原图
                          </a>
                          <button
                            type="submit"
                            form={`media-metadata-form-${selectedAsset.id}`}
                            className="inline-flex h-10 items-center justify-center px-1 text-[16px] font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:text-primary/80 hover:decoration-primary dark:text-primary dark:decoration-primary/50 dark:hover:text-primary/80"
                          >
                            保存修改
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isSearchOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[95] overflow-y-auto bg-zinc-950/30 backdrop-blur-[2px] dark:bg-black/50"
              onClick={() => setIsSearchOpen(false)}
            >
              <div className="flex min-h-full items-start justify-center px-4 py-20">
                <div
                  className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                    <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="按标题、描述或 URL 查找"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="inline-flex h-9 items-center justify-center px-2 text-xs font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                      >
                        Clear
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                      aria-label="Close media search dialog"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-[28rem] overflow-y-auto px-3 py-3">
                    {deferredQuery.trim() ? (
                      filteredAssets.length > 0 ? (
                        <div className="grid gap-1">
                          {filteredAssets.slice(0, 12).map((asset) => (
                            <button
                              key={`search-${asset.id}`}
                              type="button"
                              onClick={() => {
                                setSelectedAssetId(asset.id);
                                setIsSearchOpen(false);
                              }}
                              className="rounded-[1.1rem] px-3 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            >
                              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                <span>{getMediaTypeLabel(asset.kind)}</span>
                                <span className="shrink-0 normal-case tracking-normal">
                                  {formatAdminDateTime(asset.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">
                                {highlightText(
                                  asset.title?.trim() || getUntitledMediaLabel(asset.kind),
                                  searchTerms,
                                )}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                {highlightText(getMediaSearchPreview(asset, deferredQuery.trim()), searchTerms)}
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[1.1rem] px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                          没找到匹配的媒体记录。
                        </div>
                      )
                    ) : (
                      <div className="rounded-[1.1rem] px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                        输入标题、描述或 URL 来查找媒体。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function getMediaUsageDescription(usageSummary: AssetUsageSummary) {
  const references = [
    usageSummary.coverPostCount > 0 ? `${usageSummary.coverPostCount} 篇文章封面` : null,
    usageSummary.postContentCount > 0 ? `${usageSummary.postContentCount} 篇文章正文或草稿` : null,
    usageSummary.updateContentCount > 0 ? `${usageSummary.updateContentCount} 条动态正文或草稿` : null,
  ].filter(Boolean);

  return `这条媒体仍被 ${references.join("、")} 引用，暂时不能移出媒体库。`;
}

function InfoBlock({
  label,
  value,
  mono = false,
  dashed = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dashed?: boolean;
}) {
  return (
    <div
      className={[
        "grid gap-2 px-4 py-3",
        dashed
          ? "border border-dashed border-zinc-200/80 bg-transparent dark:border-zinc-800/80"
          : "border border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-zinc-900/60",
      ].join(" ")}
    >
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={[
          "break-words text-sm text-zinc-700 dark:text-zinc-200",
          mono ? "font-mono text-xs leading-6" : "whitespace-pre-wrap leading-6",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function UsageBlock({ references }: { references: AssetUsageReference[] }) {
  return (
    <div className="grid gap-3 border border-dashed border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        引用位置
      </p>
      <div className="grid gap-2">
        {references.map((reference) => (
          <Link
            key={`${reference.kind}-${reference.id}`}
            href={reference.href}
            className="inline-flex items-center gap-2 text-sm text-zinc-700 transition hover:text-primary dark:text-zinc-200 dark:hover:text-primary"
          >
            <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
              {getReferenceLabel(reference.kind)}
            </span>
            <span className="truncate">{reference.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getReferenceLabel(kind: AssetUsageReference["kind"]) {
  if (kind === "post-cover") {
    return "文章封面";
  }

  if (kind === "post-content") {
    return "文章正文";
  }

  return "动态正文";
}

function getMediaTypeLabel(kind: AssetItem["kind"]) {
  if (kind === "VIDEO") {
    return "Video";
  }

  if (kind === "FILE") {
    return "File";
  }

  return "Image";
}

function getUntitledMediaLabel(kind: AssetItem["kind"]) {
  if (kind === "VIDEO") {
    return "Untitled video";
  }

  if (kind === "FILE") {
    return "Untitled file";
  }

  return "Untitled image";
}

function getMediaSearchPreview(asset: MediaAssetItem, query: string) {
  const preview = asset.alt?.trim() || asset.url;
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return preview;
  }

  const normalizedPreview = preview.toLowerCase();
  const matchIndex = normalizedPreview.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return preview;
  }

  return createExcerpt(preview, matchIndex, normalizedQuery.length);
}

function createExcerpt(text: string, matchIndex: number, matchLength: number) {
  const radius = 72;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + matchLength + radius);
  const excerpt = text.slice(start, end).trim();

  if (!excerpt) {
    return text;
  }

  return `${start > 0 ? "... " : ""}${excerpt}${end < text.length ? " ..." : ""}`;
}

function getSearchTerms(query: string) {
  return Array.from(new Set(query.split(/\s+/).map((term) => term.trim()).filter(Boolean)));
}

function highlightText(text: string, searchTerms: string[]) {
  if (searchTerms.length === 0) {
    return text;
  }

  const normalizedText = text.toLowerCase();
  const sortedTerms = [...searchTerms].sort((left, right) => right.length - left.length);
  const ranges: Array<{ start: number; end: number }> = [];

  for (const term of sortedTerms) {
    let cursor = 0;

    while (cursor < normalizedText.length) {
      const matchIndex = normalizedText.indexOf(term, cursor);

      if (matchIndex === -1) {
        break;
      }

      const nextRange = { start: matchIndex, end: matchIndex + term.length };
      const overlaps = ranges.some(
        (range) => nextRange.start < range.end && nextRange.end > range.start,
      );

      if (!overlaps) {
        ranges.push(nextRange);
      }

      cursor = matchIndex + term.length;
    }
  }

  if (ranges.length === 0) {
    return text;
  }

  ranges.sort((left, right) => left.start - right.start);

  const segments: Array<string | { match: string }> = [];
  let cursor = 0;

  for (const range of ranges) {
    if (cursor < range.start) {
      segments.push(text.slice(cursor, range.start));
    }

    segments.push({ match: text.slice(range.start, range.end) });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return segments.map((segment, index) =>
    typeof segment === "string" ? (
      <span key={`text-${index}`}>{segment}</span>
    ) : (
      <mark
        key={`match-${index}`}
        className="rounded-sm bg-primary/12 px-0.5 text-inherit dark:bg-primary/20"
      >
        {segment.match}
      </mark>
    ),
  );
}
