import "server-only";

import type { UpdateMovieMetadata, UpdateMusicMetadata } from "@/lib/update-kind";
import { getSiteSettings } from "@/server/repositories/site";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

type TmdbSearchResponse = {
  results?: Array<{
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
    genre_ids?: number[];
  }>;
};

type TmdbTvDetailsResponse = {
  seasons?: Array<{
    season_number?: number;
    name?: string;
    episode_count?: number;
  }>;
};

type TmdbSeasonDetailsResponse = {
  name?: string;
  episodes?: Array<{
    episode_number?: number;
    name?: string;
    air_date?: string;
    overview?: string;
    vote_average?: number;
    still_path?: string | null;
  }>;
};

type TmdbGenreResponse = {
  genres?: Array<{
    id: number;
    name: string;
  }>;
};

type ItunesSearchResponse = {
  results?: Array<{
    wrapperType?: string;
    kind?: string;
    artistName?: string;
    trackName?: string;
    collectionName?: string;
    releaseDate?: string;
    artworkUrl100?: string;
    primaryGenreName?: string;
    trackViewUrl?: string;
    collectionViewUrl?: string;
    trackId?: number;
    collectionId?: number;
  }>;
};

export async function searchMovieCandidates(query: string): Promise<UpdateMovieMetadata[]> {
  const siteSettings = await getSiteSettings();
  const apiKey = siteSettings?.tmdbApiKey?.trim();
  const movieSource = siteSettings?.movieSource?.trim() ?? "tmdb";
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  if (movieSource !== "tmdb") {
    throw new Error("当前电影内容源暂未接入搜索。");
  }

  if (!apiKey) {
    throw new Error("请先在后台内容源设置中填写 TMDB API Key。");
  }

  const [movieGenres, tvGenres, movieResults, tvResults] = await Promise.all([
    fetchTmdbGenres("movie", apiKey),
    fetchTmdbGenres("tv", apiKey),
    fetchTmdbSearch("movie", normalizedQuery, apiKey),
    fetchTmdbSearch("tv", normalizedQuery, apiKey),
  ]);

  return [...movieResults, ...tvResults]
    .sort((left, right) => {
      const leftYear = Number.parseInt(left.year ?? "", 10) || 0;
      const rightYear = Number.parseInt(right.year ?? "", 10) || 0;
      const leftRating = Number.parseFloat(left.rating ?? "0") || 0;
      const rightRating = Number.parseFloat(right.rating ?? "0") || 0;

      return rightRating - leftRating || rightYear - leftYear;
    })
    .slice(0, 8)
    .map((item) => ({
      ...item,
      genres:
        item.sourceName === "TMDB TV"
          ? item.genres.map((genreId) => tvGenres.get(Number(genreId)) ?? String(genreId))
          : item.genres.map((genreId) => movieGenres.get(Number(genreId)) ?? String(genreId)),
    }))
    .map((item) => ({
      ...item,
      genres: item.genres.filter(Boolean),
    }));
}

export async function searchMusicCandidates(query: string): Promise<UpdateMusicMetadata[]> {
  const siteSettings = await getSiteSettings();
  const musicSource = siteSettings?.musicSource?.trim() ?? "apple-music";
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  if (musicSource !== "apple-music") {
    throw new Error("当前音乐内容源暂未接入搜索。");
  }

  try {
    const params = new URLSearchParams({
      term: normalizedQuery,
      media: "music",
      limit: "8",
    });
    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ItunesSearchResponse;

    return (payload.results ?? []).map((item) => ({
      format: normalizeItunesFormat(item.wrapperType, item.kind),
      title: item.trackName?.trim() || item.collectionName?.trim() || "",
      artist: item.artistName?.trim() || null,
      album: item.collectionName?.trim() || null,
      releaseYear: item.releaseDate ? String(new Date(item.releaseDate).getFullYear()) : null,
      coverUrl: upgradeItunesArtwork(item.artworkUrl100),
      genres: item.primaryGenreName ? [item.primaryGenreName] : [],
      appleMusicId: String(item.trackId ?? item.collectionId ?? ""),
      appleMusicUrl: item.trackViewUrl ?? item.collectionViewUrl ?? null,
      listeningNote: null,
    }));
  } catch {
    return [];
  }
}

async function fetchTmdbSearch(
  mediaType: "movie" | "tv",
  query: string,
  apiKey: string,
) {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query,
      language: "zh-CN",
      include_adult: "false",
      page: "1",
    });
    const response = await fetch(
      `https://api.themoviedb.org/3/search/${mediaType}?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [] as Array<
        UpdateMovieMetadata & {
          sourceName: string;
          genres: string[];
        }
      >;
    }

    const payload = (await response.json()) as TmdbSearchResponse;

    return (payload.results ?? []).slice(0, 6).map((item) => {
      const title = item.title?.trim() || item.name?.trim() || "";
      const originalTitle = item.original_title?.trim() || item.original_name?.trim() || null;
      const yearSource = item.release_date || item.first_air_date || null;

      return {
        format: mediaType === "tv" ? "TV" : "Movie",
        tmdbId: String(item.id),
        seasonNumber: null,
        seasonName: null,
        episodeNumber: null,
        episodeTitle: null,
        title,
        originalTitle,
        year: yearSource ? String(new Date(yearSource).getFullYear()) : null,
        posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
        director: null,
        genres: (item.genre_ids ?? []).map(String),
        overview: item.overview?.trim() || null,
        rating:
          typeof item.vote_average === "number" && item.vote_average > 0
            ? item.vote_average.toFixed(1)
            : null,
        sourceName: mediaType === "tv" ? "TMDB TV" : "TMDB",
        sourceUrl: title
          ? `https://www.themoviedb.org/${mediaType}/${item.id}`
          : null,
      };
    });
  } catch {
    return [] as Array<
      UpdateMovieMetadata & {
        sourceName: string;
        genres: string[];
      }
    >;
  }
}

export async function searchTvSeasonCandidates(tmdbId: string) {
  const apiKey = await getTmdbApiKey();

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "zh-CN",
    });
    const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [] as Array<{ seasonNumber: string; seasonName: string; episodeCount: string | null }>;
    }

    const payload = (await response.json()) as TmdbTvDetailsResponse;

    return (payload.seasons ?? [])
      .filter((season) => typeof season.season_number === "number" && season.season_number >= 0)
      .map((season) => ({
        seasonNumber: String(season.season_number),
        seasonName: season.name?.trim() || `Season ${season.season_number}`,
        episodeCount:
          typeof season.episode_count === "number" && season.episode_count > 0
            ? String(season.episode_count)
            : null,
      }))
      .sort((left, right) => Number(left.seasonNumber) - Number(right.seasonNumber));
  } catch {
    return [] as Array<{ seasonNumber: string; seasonName: string; episodeCount: string | null }>;
  }
}

export async function searchTvEpisodeCandidates(tmdbId: string, seasonNumber: string) {
  const apiKey = await getTmdbApiKey();

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "zh-CN",
    });
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [] as Array<{
        episodeNumber: string;
        episodeTitle: string;
        seasonName: string | null;
        year: string | null;
        overview: string | null;
        rating: string | null;
      }>;
    }

    const payload = (await response.json()) as TmdbSeasonDetailsResponse;

    return (payload.episodes ?? [])
      .filter((episode) => typeof episode.episode_number === "number")
      .map((episode) => ({
        episodeNumber: String(episode.episode_number),
        episodeTitle: episode.name?.trim() || `Episode ${episode.episode_number}`,
        seasonName: payload.name?.trim() || null,
        year: episode.air_date ? String(new Date(episode.air_date).getFullYear()) : null,
        overview: episode.overview?.trim() || null,
        rating:
          typeof episode.vote_average === "number" && episode.vote_average > 0
            ? episode.vote_average.toFixed(1)
            : null,
      }))
      .sort((left, right) => Number(left.episodeNumber) - Number(right.episodeNumber));
  } catch {
    return [] as Array<{
      episodeNumber: string;
      episodeTitle: string;
      seasonName: string | null;
      year: string | null;
      overview: string | null;
      rating: string | null;
    }>;
  }
}

async function fetchTmdbGenres(mediaType: "movie" | "tv", apiKey: string) {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "zh-CN",
    });
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/${mediaType}/list?${params.toString()}`,
      {
        cache: "force-cache",
      },
    );

    if (!response.ok) {
      return new Map<number, string>();
    }

    const payload = (await response.json()) as TmdbGenreResponse;
    return new Map((payload.genres ?? []).map((genre) => [genre.id, genre.name]));
  } catch {
    return new Map<number, string>();
  }
}

async function getTmdbApiKey() {
  const siteSettings = await getSiteSettings();
  const apiKey = siteSettings?.tmdbApiKey?.trim();
  const movieSource = siteSettings?.movieSource?.trim() ?? "tmdb";

  if (movieSource !== "tmdb") {
    throw new Error("当前电影内容源暂未接入搜索。");
  }

  if (!apiKey) {
    throw new Error("请先在后台内容源设置中填写 TMDB API Key。");
  }

  return apiKey;
}

function normalizeItunesFormat(wrapperType?: string, kind?: string) {
  if (wrapperType === "collection") {
    return "Album";
  }

  if (kind === "song") {
    return "Song";
  }

  return "Music";
}

function upgradeItunesArtwork(value?: string) {
  if (!value) {
    return null;
  }

  return value.replace(/100x100bb\.jpg$/i, "512x512bb.jpg");
}
