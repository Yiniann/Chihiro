"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  UpdateMetadata,
  UpdateKindValue,
  UpdateMovieMetadata,
  UpdateMusicMetadata,
  UpdateObjectMetadata,
} from "@/lib/update-kind";

type TvSeasonCandidate = {
  seasonNumber: string;
  seasonName: string;
  episodeCount: string | null;
  posterUrl: string | null;
};

type TvEpisodeCandidate = {
  episodeNumber: string;
  episodeTitle: string;
  seasonName: string | null;
  year: string | null;
  overview: string | null;
  rating: string | null;
  stillUrl: string | null;
};

export function KindMetadataFields({
  kind,
  metadata,
  onMetadataChange,
  onDirty,
  onMovieSelect,
  onMusicSelect,
  searchActionLabel,
}: {
  kind: UpdateKindValue;
  metadata: UpdateMetadata;
  onMetadataChange: (metadata: UpdateMetadata) => void;
  onDirty: () => void;
  onMovieSelect?: (metadata: UpdateMovieMetadata) => void;
  onMusicSelect?: (metadata: UpdateMusicMetadata) => void;
  searchActionLabel?: string;
}) {
  if (kind === "MOVIE") {
    return (
      <MovieSearchFields
        metadata={metadata.kind === "MOVIE" ? metadata.data : emptyMovieMetadata()}
        onMetadataChange={(data) => onMetadataChange({ kind: "MOVIE", data })}
        onDirty={onDirty}
        onSelectResult={onMovieSelect}
        searchActionLabel={searchActionLabel}
      />
    );
  }

  if (kind === "MUSIC") {
    return (
      <MusicSearchFields
        metadata={metadata.kind === "MUSIC" ? metadata.data : emptyMusicMetadata()}
        onMetadataChange={(data) => onMetadataChange({ kind: "MUSIC", data })}
        onDirty={onDirty}
        onSelectResult={onMusicSelect}
        searchActionLabel={searchActionLabel}
      />
    );
  }

  if (kind === "OBJECT") {
    const objectMetadata = metadata.kind === "OBJECT" ? metadata.data : emptyObjectMetadata();

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="物品标题"
          value={objectMetadata.title}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, title: value } });
            onDirty();
          }}
        />
        <Field
          label="slug"
          value={objectMetadata.slug ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, slug: value || null } });
            onDirty();
          }}
        />
        <Field
          label="品牌"
          value={objectMetadata.brand ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, brand: value || null } });
            onDirty();
          }}
        />
        <Field
          label="型号"
          value={objectMetadata.model ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, model: value || null } });
            onDirty();
          }}
        />
        <Field
          label="分类"
          value={objectMetadata.category ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, category: value || null } });
            onDirty();
          }}
        />
        <Field
          label="头图链接"
          value={objectMetadata.heroImage ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, heroImage: value || null } });
            onDirty();
          }}
          className="md:col-span-2"
        />
        <TextareaField
          label="卡片摘要"
          value={objectMetadata.summary ?? ""}
          onChange={(value) => {
            onMetadataChange({ kind: "OBJECT", data: { ...objectMetadata, summary: value || null } });
            onDirty();
          }}
          className="md:col-span-2"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/70 px-5 py-4 text-sm leading-7 text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-300">
      当前是普通动态，不需要额外卡片字段。后面如果切到电影、音乐或物品，这里会出现对应的结构化内容表单。
    </div>
  );
}

function MovieSearchFields({
  metadata,
  onMetadataChange,
  onDirty,
  onSelectResult,
  searchActionLabel,
}: {
  metadata: UpdateMovieMetadata;
  onMetadataChange: (metadata: UpdateMovieMetadata) => void;
  onDirty: () => void;
  onSelectResult?: (metadata: UpdateMovieMetadata) => void;
  searchActionLabel?: string;
}) {
  const [query, setQuery] = useState(metadata.title ?? "");
  const [results, setResults] = useState<UpdateMovieMetadata[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<UpdateMovieMetadata | null>(
    metadata.format === "TV" && metadata.tmdbId ? metadata : null,
  );
  const [seasons, setSeasons] = useState<TvSeasonCandidate[]>([]);
  const [episodes, setEpisodes] = useState<TvEpisodeCandidate[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<TvSeasonCandidate | null>(
    metadata.seasonNumber
        ? {
          seasonNumber: metadata.seasonNumber,
          seasonName: metadata.seasonName ?? `Season ${metadata.seasonNumber}`,
          episodeCount: null,
          posterUrl: metadata.posterUrl ?? null,
        }
      : null,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const movieSelectionStep = selectedSeries
    ? selectedSeason
      ? "episodes"
      : "seasons"
    : "search";

  useEffect(() => {
    if (!selectedSeries?.tmdbId || seasons.length > 0) {
      return;
    }

    const tmdbId = selectedSeries.tmdbId;

    let cancelled = false;

    void (async () => {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/updates/media-search?kind=tv-seasons&tmdbId=${encodeURIComponent(tmdbId)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as {
          items?: TvSeasonCandidate[];
          error?: string;
        };

        if (!response.ok) {
          if (!cancelled) {
            setStatus("error");
            setError(payload.error ?? "季列表加载失败。");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        const nextSeasons = payload.items ?? [];
        setSeasons(nextSeasons);
        setSelectedSeason((currentSeason) => {
          if (!currentSeason) {
            return currentSeason;
          }

          return (
            nextSeasons.find((season) => season.seasonNumber === currentSeason.seasonNumber) ??
            currentSeason
          );
        });
        setStatus("idle");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("季列表加载失败。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSeries?.tmdbId, seasons.length]);

  useEffect(() => {
    if (!selectedSeries?.tmdbId || !selectedSeason?.seasonNumber || episodes.length > 0) {
      return;
    }

    const tmdbId = selectedSeries.tmdbId;
    const seasonNumber = selectedSeason.seasonNumber;

    let cancelled = false;

    void (async () => {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/updates/media-search?kind=tv-episodes&tmdbId=${encodeURIComponent(
            tmdbId,
          )}&seasonNumber=${encodeURIComponent(seasonNumber)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as {
          items?: TvEpisodeCandidate[];
          error?: string;
        };

        if (!response.ok) {
          if (!cancelled) {
            setStatus("error");
            setError(payload.error ?? "集列表加载失败。");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setEpisodes(payload.items ?? []);
        setStatus("idle");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("集列表加载失败。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSeries?.tmdbId, selectedSeason?.seasonNumber, episodes.length]);

  return (
    <div className="grid gap-4">
      {movieSelectionStep !== "search" ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              {movieSelectionStep === "seasons" ? "选择季度" : "选择剧集"}
            </p>
            <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
              {selectedSeries?.title}
              {selectedSeason ? ` · ${seasonLabel(selectedSeason.seasonNumber)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (movieSelectionStep === "episodes") {
                setSelectedSeason(null);
                setEpisodes([]);
                setError(null);
                setStatus("idle");
                return;
              }

              setSelectedSeries(null);
              setSelectedSeason(null);
              setSeasons([]);
              setEpisodes([]);
              setError(null);
              setStatus("idle");
            }}
            className="shrink-0 text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {movieSelectionStep === "episodes" ? "其他季度" : "其他影视作品"}
          </button>
        </div>
      ) : (
        <SearchPanel
          label="搜索电影 / 剧集"
          query={query}
          setQuery={setQuery}
          status={status}
          error={error}
          actionLabel={searchActionLabel}
          onSearch={async () => {
            setStatus("loading");
            setError(null);
          setSelectedSeries(null);
          setSelectedSeason(null);
          setSeasons([]);
          setEpisodes([]);
          setHasSearched(true);

          try {
              const response = await fetch(`/api/admin/updates/media-search?kind=movie&q=${encodeURIComponent(query)}`, {
                method: "GET",
                cache: "no-store",
              });
              const payload = (await response.json()) as { items?: UpdateMovieMetadata[]; error?: string };

              if (!response.ok) {
                setStatus("error");
                setError(payload.error ?? "搜索失败。");
                return;
              }

              setResults(payload.items ?? []);
              setStatus("idle");
            } catch {
              setStatus("error");
              setError("搜索时出错了。");
            }
          }}
        />
      )}

      {movieSelectionStep === "search" && results.length > 0 ? (
        <div className="grid max-h-[22rem] gap-3 overflow-y-auto pr-1">
          {results.map((item) => (
            <button
              key={`${item.title}-${item.year}-${item.sourceUrl ?? ""}`}
              type="button"
              onClick={async () => {
                if (item.format === "TV" && item.tmdbId) {
                  setStatus("loading");
                  setError(null);

                  try {
                    const response = await fetch(
                      `/api/admin/updates/media-search?kind=tv-seasons&tmdbId=${encodeURIComponent(item.tmdbId)}`,
                      {
                        method: "GET",
                        cache: "no-store",
                      },
                    );
                    const payload = (await response.json()) as {
                      items?: TvSeasonCandidate[];
                      error?: string;
                    };

                    if (!response.ok) {
                      setStatus("error");
                      setError(payload.error ?? "季列表加载失败。");
                      return;
                    }

                    setSelectedSeries(item);
                    setSelectedSeason(null);
                    setSeasons(payload.items ?? []);
                    setEpisodes([]);
                    setResults([]);
                    setQuery(item.title);
                    setStatus("idle");
                    return;
                  } catch {
                    setStatus("error");
                    setError("季列表加载失败。");
                    return;
                  }
                }

                if (onSelectResult) {
                  onSelectResult(item);
                  return;
                }

                onMetadataChange(item);
                setQuery(item.title);
                setResults([]);
                onDirty();
              }}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{item.title}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {[item.format, item.year, item.originalTitle, item.sourceName].filter(Boolean).join(" · ")}
              </p>
              {item.overview ? (
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {item.overview}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {movieSelectionStep === "search" && hasSearched && status === "idle" && !error && results.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">没有搜索到相关影视作品。</p>
      ) : null}

      {movieSelectionStep === "seasons" && selectedSeries && seasons.length > 0 ? (
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-[1rem] border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                选择季度
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onSelectResult) {
                    onSelectResult(selectedSeries);
                    return;
                  }

                  onMetadataChange(selectedSeries);
                  setQuery(selectedSeries.title);
                  setResults([]);
                  setSeasons([]);
                  setEpisodes([]);
                  onDirty();
                }}
                className="text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                选择整部剧
              </button>
            </div>
            <div className="max-h-[16rem] overflow-y-auto">
              {seasons.map((season) => (
                <button
                  key={season.seasonNumber}
                  type="button"
                  onClick={async () => {
                    setStatus("loading");
                    setError(null);

                    try {
                      const response = await fetch(
                        `/api/admin/updates/media-search?kind=tv-episodes&tmdbId=${encodeURIComponent(
                          selectedSeries.tmdbId ?? "",
                        )}&seasonNumber=${encodeURIComponent(season.seasonNumber)}`,
                        {
                          method: "GET",
                          cache: "no-store",
                        },
                      );
                      const payload = (await response.json()) as {
                        items?: TvEpisodeCandidate[];
                        error?: string;
                      };

                      if (!response.ok) {
                        setStatus("error");
                        setError(payload.error ?? "集列表加载失败。");
                        return;
                      }

                      setSelectedSeason(season);
                      setEpisodes(payload.items ?? []);
                      setStatus("idle");
                    } catch {
                      setStatus("error");
                      setError("集列表加载失败。");
                    }
                  }}
                  className="block w-full border-b border-zinc-200/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {seasonLabel(season.seasonNumber)} · {season.seasonName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {season.episodeCount ? `${season.episodeCount} 集` : "查看本季剧集"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {movieSelectionStep === "episodes" && selectedSeries && selectedSeason && episodes.length > 0 ? (
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-[1rem] border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                选择剧集
              </p>
              <button
                type="button"
                onClick={() => {
                  const nextMetadata = buildSeasonMovieMetadata(selectedSeries, selectedSeason);

                  if (onSelectResult) {
                    onSelectResult(nextMetadata);
                    return;
                  }

                  onMetadataChange(nextMetadata);
                  setQuery(selectedSeries.title);
                  setResults([]);
                  setSeasons([]);
                  setEpisodes([]);
                  onDirty();
                }}
                className="text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                选择整个季度
              </button>
            </div>
            <div className="max-h-[18rem] overflow-y-auto">
              {episodes.map((episode) => (
                <button
                  key={`${selectedSeason.seasonNumber}-${episode.episodeNumber}`}
                  type="button"
                  onClick={() => {
                    const nextMetadata: UpdateMovieMetadata = {
                      ...selectedSeries,
                      year: episode.year ?? selectedSeries.year,
                      seasonNumber: selectedSeason.seasonNumber,
                      seasonName: selectedSeason.seasonName,
                      episodeNumber: episode.episodeNumber,
                      episodeTitle: episode.episodeTitle,
                      posterUrl:
                        episode.stillUrl ??
                        selectedSeason.posterUrl ??
                        selectedSeries.posterUrl,
                      overview: episode.overview ?? selectedSeries.overview,
                      rating: episode.rating ?? selectedSeries.rating,
                      sourceUrl: selectedSeries.tmdbId
                        ? `https://www.themoviedb.org/tv/${selectedSeries.tmdbId}/season/${selectedSeason.seasonNumber}/episode/${episode.episodeNumber}`
                        : selectedSeries.sourceUrl,
                    };

                    if (onSelectResult) {
                      onSelectResult(nextMetadata);
                      return;
                    }

                    onMetadataChange(nextMetadata);
                    setQuery(selectedSeries.title);
                    setResults([]);
                    setSeasons([]);
                    setEpisodes([]);
                    onDirty();
                  }}
                  className="block w-full border-b border-zinc-200/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {episodeLabel(selectedSeason.seasonNumber, episode.episodeNumber)} · {episode.episodeTitle}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {[selectedSeries.title, episode.year].filter(Boolean).join(" · ")}
                  </p>
                  {episode.overview ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {episode.overview}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MusicSearchFields({
  metadata,
  onMetadataChange,
  onDirty,
  onSelectResult,
  searchActionLabel,
}: {
  metadata: UpdateMusicMetadata;
  onMetadataChange: (metadata: UpdateMusicMetadata) => void;
  onDirty: () => void;
  onSelectResult?: (metadata: UpdateMusicMetadata) => void;
  searchActionLabel?: string;
}) {
  const [query, setQuery] = useState(metadata.title ?? "");
  const [results, setResults] = useState<UpdateMusicMetadata[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  return (
    <div className="grid gap-4">
      <SearchPanel
        label="搜索音乐"
        query={query}
        setQuery={setQuery}
        status={status}
        error={error}
        actionLabel={searchActionLabel}
        onSearch={async () => {
          setStatus("loading");
          setError(null);
          setHasSearched(true);

          try {
            const response = await fetch(`/api/admin/updates/media-search?kind=music&q=${encodeURIComponent(query)}`, {
              method: "GET",
              cache: "no-store",
            });
            const payload = (await response.json()) as { items?: UpdateMusicMetadata[]; error?: string };

            if (!response.ok) {
              setStatus("error");
              setError(payload.error ?? "搜索失败。");
              return;
            }

            setResults(payload.items ?? []);
            setStatus("idle");
          } catch {
            setStatus("error");
            setError("搜索时出错了。");
          }
        }}
      />

      {results.length > 0 ? (
        <div className="grid max-h-[22rem] gap-3 overflow-y-auto pr-1">
          {results.map((item) => (
            <button
              key={`${item.title}-${item.artist ?? ""}-${item.appleMusicId ?? ""}`}
              type="button"
              onClick={() => {
                if (onSelectResult) {
                  onSelectResult(item);
                  return;
                }

                onMetadataChange(item);
                setQuery(item.title);
                setResults([]);
                onDirty();
              }}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{item.title}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {[item.artist, item.album, item.releaseYear].filter(Boolean).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {hasSearched && status === "idle" && !error && results.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">没有搜索到相关音乐内容。</p>
      ) : null}
    </div>
  );
}

function SearchPanel({
  label,
  query,
  setQuery,
  status,
  error,
  onSearch,
  actionLabel,
}: {
  label: string;
  query: string;
  setQuery: (value: string) => void;
  status: "idle" | "loading" | "error";
  error: string | null;
  onSearch: () => Promise<void>;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="grid flex-1 gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {label}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入标题关键词"
            className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void onSearch();
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white md:self-end"
          disabled={!query.trim() || status === "loading"}
        >
          {status === "loading" ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
          {status === "loading" ? "搜索中..." : actionLabel ?? "搜索并回填"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}

export function HiddenField({ name, value }: { name: string; value: string | null }) {
  return <input type="hidden" name={name} value={value ?? ""} />;
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-7 text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
      />
    </label>
  );
}

function emptyMovieMetadata(): UpdateMovieMetadata {
  return {
    format: null,
    tmdbId: null,
    seasonNumber: null,
    seasonName: null,
    episodeNumber: null,
    episodeTitle: null,
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
  };
}

function buildSeasonMovieMetadata(
  series: UpdateMovieMetadata,
  season: TvSeasonCandidate,
): UpdateMovieMetadata {
  return {
    ...series,
    seasonNumber: season.seasonNumber,
    seasonName: season.seasonName,
    episodeNumber: null,
    episodeTitle: null,
    posterUrl: season.posterUrl ?? series.posterUrl,
    sourceUrl: series.tmdbId
      ? `https://www.themoviedb.org/tv/${series.tmdbId}/season/${season.seasonNumber}`
      : series.sourceUrl,
  };
}

function seasonLabel(seasonNumber: string) {
  return `S${seasonNumber.padStart(2, "0")}`;
}

function episodeLabel(seasonNumber: string, episodeNumber: string) {
  return `${seasonLabel(seasonNumber)}E${episodeNumber.padStart(2, "0")}`;
}

function emptyMusicMetadata(): UpdateMusicMetadata {
  return {
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
  };
}

function emptyObjectMetadata(): UpdateObjectMetadata {
  return {
    title: "",
    slug: null,
    heroImage: null,
    brand: null,
    model: null,
    category: null,
    summary: null,
    detailPath: null,
  };
}
