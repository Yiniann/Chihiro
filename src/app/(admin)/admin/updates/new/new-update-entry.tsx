"use client";

import { Plus, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { UpdateSelectionStepper } from "@/app/(admin)/admin/updates/update-selection-stepper";
import { DialogShell } from "@/components/dialog-shell";
import { updateKindOptions, type UpdateKindValue, type UpdateMovieMetadata, type UpdateMusicMetadata } from "@/lib/update-kind";

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

export function NewUpdateEntry() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-6 grid gap-3">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
            Create Update
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            新建动态
          </h1>
        </div>
        <NewUpdateEntryPanel />
      </div>
    </main>
  );
}

export function CreateUpdateDialog({
  triggerLabel,
  triggerClassName,
  triggerContent,
}: {
  triggerLabel: string;
  triggerClassName: string;
  triggerContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
        aria-label={triggerLabel}
      >
        {triggerContent ?? (
          <>
            <Plus className="h-4 w-4" />
            {triggerLabel}
          </>
        )}
      </button>
      <DialogShell
        open={open}
        onOpenChange={setOpen}
        title="新建动态"
        eyebrow="Create Update"
        maxWidthClassName="max-w-4xl"
        widthClassName="w-fit"
        overlayClassName="z-[95]"
      >
        <NewUpdateEntryPanel />
      </DialogShell>
    </>
  );
}

function NewUpdateEntryPanel() {
  const router = useRouter();
  const [kind, setKind] = useState<UpdateKindValue | null>(null);
  const [query, setQuery] = useState("");
  const [movieResults, setMovieResults] = useState<UpdateMovieMetadata[]>([]);
  const [musicResults, setMusicResults] = useState<UpdateMusicMetadata[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<UpdateMovieMetadata | null>(null);
  const [seasons, setSeasons] = useState<TvSeasonCandidate[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<TvSeasonCandidate | null>(null);
  const [episodes, setEpisodes] = useState<TvEpisodeCandidate[]>([]);
  const [objectTitle, setObjectTitle] = useState("");
  const [objectBrand, setObjectBrand] = useState("");
  const [objectModel, setObjectModel] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const movieSelectionStep =
    kind !== "MOVIE"
      ? "search"
      : selectedSeries
        ? selectedSeason
          ? "episodes"
          : "seasons"
        : "search";

  const selectedOption = kind
    ? updateKindOptions.find((option) => option.value === kind) ?? null
    : null;

  return (
    <UpdateSelectionStepper
      step={selectedOption ? "details" : "choose"}
      selectedKind={kind ?? "NOTE"}
      onSelectKind={(nextKind) => {
        if (nextKind === "NOTE") {
          router.push("/admin/updates/new?mode=editor&kind=NOTE");
          return;
        }

        setKind(nextKind);
        setQuery("");
        setMovieResults([]);
        setMusicResults([]);
        setSelectedSeries(null);
        setSelectedSeason(null);
        setSeasons([]);
        setEpisodes([]);
        setError(null);
        setStatus("idle");
      }}
      onBack={() => {
        setKind(null);
        setQuery("");
        setMovieResults([]);
        setMusicResults([]);
        setSelectedSeries(null);
        setSelectedSeason(null);
        setSeasons([]);
        setEpisodes([]);
        setError(null);
        setStatus("idle");
      }}
    >
      {kind === "MOVIE" || kind === "MUSIC" ? (
        <div className="grid gap-4">
          {kind === "MOVIE" && movieSelectionStep !== "search" ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  {movieSelectionStep === "seasons" ? "选择季度" : "选择剧集"}
                </p>
                <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
                  {selectedSeries?.title}
                  {selectedSeason
                    ? ` · ${seasonLabel(selectedSeason.seasonNumber)}`
                    : ""}
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
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={kind === "MOVIE" ? "输入片名或剧名" : "输入歌名、专辑名或艺人"}
                className="h-12 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={!query.trim() || status === "loading"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                {status === "loading" ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
                {status === "loading" ? "搜索中..." : "搜索"}
              </button>
            </div>
          )}

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          {(kind === "MOVIE" ? movieSelectionStep === "search" : true) ? (
            <div className="overflow-hidden rounded-[1rem] border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              <div className="max-h-[22rem] overflow-y-auto">
                {(kind === "MOVIE" ? movieResults : musicResults).map((item) => (
                  <button
                    key={kind === "MOVIE"
                      ? `${(item as UpdateMovieMetadata).title}-${(item as UpdateMovieMetadata).sourceUrl ?? ""}`
                      : `${(item as UpdateMusicMetadata).title}-${(item as UpdateMusicMetadata).appleMusicId ?? ""}`}
                    type="button"
                    onClick={async () => {
                      if (kind === "MOVIE") {
                        const movieItem = item as UpdateMovieMetadata;

                        if (movieItem.format === "TV" && movieItem.tmdbId) {
                          setStatus("loading");
                          setError(null);

                          try {
                            const response = await fetch(
                              `/api/admin/updates/media-search?kind=tv-seasons&tmdbId=${encodeURIComponent(movieItem.tmdbId)}`,
                              { method: "GET", cache: "no-store" },
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

                            setSelectedSeries(movieItem);
                            setSelectedSeason(null);
                            setSeasons(payload.items ?? []);
                            setEpisodes([]);
                            setMovieResults([]);
                            setQuery(movieItem.title);
                            setStatus("idle");
                            return;
                          } catch {
                            setStatus("error");
                            setError("季列表加载失败。");
                            return;
                          }
                        }

                        router.push(buildMovieEditorUrl(movieItem));
                        return;
                      }

                      router.push(buildMusicEditorUrl(item as UpdateMusicMetadata));
                    }}
                    className="block w-full border-b border-zinc-200/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                  >
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {kind === "MOVIE"
                        ? [
                            ((item as UpdateMovieMetadata).format),
                            ((item as UpdateMovieMetadata).year),
                            ((item as UpdateMovieMetadata).originalTitle),
                            ((item as UpdateMovieMetadata).sourceName),
                          ].filter(Boolean).join(" · ")
                        : [((item as UpdateMusicMetadata).artist), ((item as UpdateMusicMetadata).album), ((item as UpdateMusicMetadata).releaseYear)].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {kind === "MOVIE" && movieSelectionStep === "seasons" && selectedSeries && seasons.length > 0 ? (
            <div className="overflow-hidden rounded-[1rem] border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  选择季度
                </p>
                <button
                  type="button"
                  onClick={() => router.push(buildMovieEditorUrl(selectedSeries))}
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
                          { method: "GET", cache: "no-store" },
                        );
                        const payload = (await response.json()) as {
                          items?: TvEpisodeCandidate[];
                          error?: string;
                        };

                        if (!response.ok) {
                          setStatus("error");
                          setError(payload.error ?? "剧集列表加载失败。");
                          return;
                        }

                        setSelectedSeason(season);
                        setEpisodes(payload.items ?? []);
                        setStatus("idle");
                      } catch {
                        setStatus("error");
                        setError("剧集列表加载失败。");
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
          ) : null}

          {kind === "MOVIE" && movieSelectionStep === "episodes" && selectedSeries && selectedSeason && episodes.length > 0 ? (
            <div className="overflow-hidden rounded-[1rem] border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  选择剧集
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      buildMovieEditorUrl(buildSeasonMovieSelection(selectedSeries, selectedSeason)),
                    )
                  }
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
                    onClick={() =>
                      router.push(
                        buildMovieEditorUrl({
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
                        }),
                      )
                    }
                    className="block w-full border-b border-zinc-200/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                  >
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {episodeLabel(selectedSeason.seasonNumber, episode.episodeNumber)} · {episode.episodeTitle}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {[selectedSeries.title, episode.year].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {kind === "OBJECT" ? (
        <div className="grid gap-4">
          <input
            value={objectTitle}
            onChange={(event) => setObjectTitle(event.target.value)}
            placeholder="物品标题"
            className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={objectBrand}
              onChange={(event) => setObjectBrand(event.target.value)}
              placeholder="品牌"
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
            <input
              value={objectModel}
              onChange={(event) => setObjectModel(event.target.value)}
              placeholder="型号"
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </div>
          <PrimaryAction
            onClick={() =>
              router.push(
                `/admin/updates/new?mode=editor&kind=OBJECT&objectTitle=${encodeURIComponent(objectTitle)}&objectBrand=${encodeURIComponent(objectBrand)}&objectModel=${encodeURIComponent(objectModel)}`,
              )
            }
            disabled={!objectTitle.trim()}
          >
            进入物品编辑
          </PrimaryAction>
        </div>
      ) : null}
    </UpdateSelectionStepper>
  );

  async function handleSearch() {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/updates/media-search?kind=${kind === "MOVIE" ? "movie" : "music"}&q=${encodeURIComponent(query)}`,
        { method: "GET", cache: "no-store" },
      );
      const payload = (await response.json()) as {
        items?: UpdateMovieMetadata[] | UpdateMusicMetadata[];
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(payload.error ?? "搜索失败。");
        return;
      }

      if (kind === "MOVIE") {
        setMovieResults((payload.items as UpdateMovieMetadata[]) ?? []);
        setSelectedSeries(null);
        setSelectedSeason(null);
        setSeasons([]);
        setEpisodes([]);
      } else {
        setMusicResults((payload.items as UpdateMusicMetadata[]) ?? []);
      }

      setStatus("idle");
    } catch {
      setStatus("error");
      setError("搜索时出错了。");
    }
  }
}

function PrimaryAction({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
    >
      {children}
    </button>
  );
}

function buildMovieEditorUrl(item: UpdateMovieMetadata) {
  const params = new URLSearchParams({
    mode: "editor",
    kind: "MOVIE",
    movieTitle: item.title,
  });

  setOptionalParam(params, "movieFormat", item.format);
  setOptionalParam(params, "movieTmdbId", item.tmdbId);
  setOptionalParam(params, "movieSeasonNumber", item.seasonNumber);
  setOptionalParam(params, "movieSeasonName", item.seasonName);
  setOptionalParam(params, "movieEpisodeNumber", item.episodeNumber);
  setOptionalParam(params, "movieEpisodeTitle", item.episodeTitle);
  setOptionalParam(params, "movieOriginalTitle", item.originalTitle);
  setOptionalParam(params, "movieYear", item.year);
  setOptionalParam(params, "moviePosterUrl", item.posterUrl);
  setOptionalParam(params, "movieDirector", item.director);
  setOptionalParam(params, "movieGenres", item.genres.join(", "));
  setOptionalParam(params, "movieOverview", item.overview);
  setOptionalParam(params, "movieRating", item.rating);
  setOptionalParam(params, "movieSourceName", item.sourceName);
  setOptionalParam(params, "movieSourceUrl", item.sourceUrl);

  return `/admin/updates/new?${params.toString()}`;
}

function buildMusicEditorUrl(item: UpdateMusicMetadata) {
  const params = new URLSearchParams({
    mode: "editor",
    kind: "MUSIC",
    musicTitle: item.title,
  });

  setOptionalParam(params, "musicFormat", item.format);
  setOptionalParam(params, "musicArtist", item.artist);
  setOptionalParam(params, "musicAlbum", item.album);
  setOptionalParam(params, "musicReleaseYear", item.releaseYear);
  setOptionalParam(params, "musicCoverUrl", item.coverUrl);
  setOptionalParam(params, "musicGenres", item.genres.join(", "));
  setOptionalParam(params, "musicAppleMusicId", item.appleMusicId);
  setOptionalParam(params, "musicAppleMusicUrl", item.appleMusicUrl);

  return `/admin/updates/new?${params.toString()}`;
}

function buildSeasonMovieSelection(
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

function setOptionalParam(params: URLSearchParams, key: string, value: string | null) {
  if (value && value.trim()) {
    params.set(key, value);
  }
}

function seasonLabel(seasonNumber: string) {
  return `S${seasonNumber.padStart(2, "0")}`;
}

function episodeLabel(seasonNumber: string, episodeNumber: string) {
  return `${seasonLabel(seasonNumber)}E${episodeNumber.padStart(2, "0")}`;
}
