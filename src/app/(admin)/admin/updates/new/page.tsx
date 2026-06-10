import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { NewUpdateEntry } from "@/app/(admin)/admin/updates/new/new-update-entry";
import type { UpdateMetadata, UpdateKindValue } from "@/lib/update-kind";
import { siteConfig } from "@/lib/site";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

type AdminNewUpdatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminNewUpdatePage({ searchParams }: AdminNewUpdatePageProps) {
  const ownerProfile = await getOwnerDisplayProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mode = getSingleQueryValue(resolvedSearchParams, "mode");
  const initialKind = getInitialKind(getSingleQueryValue(resolvedSearchParams, "kind"));
  const initialMetadata = initialKind
    ? getInitialMetadata(initialKind, resolvedSearchParams)
    : null;
  const initialPublishedAt = getSingleQueryValue(resolvedSearchParams, "publishedAt");

  if (mode !== "editor" || !initialKind || !initialMetadata) {
    return <NewUpdateEntry />;
  }

  return (
    <UpdateEditorForm
      update={null}
      authorName={getOwnerDisplayName(ownerProfile, siteConfig.author)}
      initialKind={initialKind}
      initialMetadata={initialMetadata}
      initialPublishedAt={initialPublishedAt}
    />
  );
}

function getSingleQueryValue(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function getInitialKind(value: string | null): UpdateKindValue | null {
  if (value === "NOTE" || value === "MOVIE" || value === "MUSIC" || value === "OBJECT") {
    return value;
  }

  return null;
}

function getInitialMetadata(
  kind: UpdateKindValue,
  searchParams: Record<string, string | string[] | undefined> | undefined,
): UpdateMetadata | null {
  if (kind === "NOTE") {
    return { kind, data: null };
  }

  if (kind === "MOVIE") {
    return {
      kind,
      data: {
        format: getSingleQueryValue(searchParams, "movieFormat"),
        tmdbId: getSingleQueryValue(searchParams, "movieTmdbId"),
        seasonNumber: getSingleQueryValue(searchParams, "movieSeasonNumber"),
        seasonName: getSingleQueryValue(searchParams, "movieSeasonName"),
        episodeNumber: getSingleQueryValue(searchParams, "movieEpisodeNumber"),
        episodeTitle: getSingleQueryValue(searchParams, "movieEpisodeTitle"),
        title: getSingleQueryValue(searchParams, "movieTitle") ?? "",
        originalTitle: getSingleQueryValue(searchParams, "movieOriginalTitle"),
        year: getSingleQueryValue(searchParams, "movieYear"),
        posterUrl: getSingleQueryValue(searchParams, "moviePosterUrl"),
        director: getSingleQueryValue(searchParams, "movieDirector"),
        genres: (getSingleQueryValue(searchParams, "movieGenres") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        overview: getSingleQueryValue(searchParams, "movieOverview"),
        rating: getSingleQueryValue(searchParams, "movieRating"),
        sourceName: getSingleQueryValue(searchParams, "movieSourceName"),
        sourceUrl: getSingleQueryValue(searchParams, "movieSourceUrl"),
      },
    };
  }

  if (kind === "MUSIC") {
    return {
      kind,
      data: {
        format: getSingleQueryValue(searchParams, "musicFormat"),
        title: getSingleQueryValue(searchParams, "musicTitle") ?? "",
        artist: getSingleQueryValue(searchParams, "musicArtist"),
        album: getSingleQueryValue(searchParams, "musicAlbum"),
        releaseYear: getSingleQueryValue(searchParams, "musicReleaseYear"),
        coverUrl: getSingleQueryValue(searchParams, "musicCoverUrl"),
        genres: (getSingleQueryValue(searchParams, "musicGenres") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        appleMusicId: getSingleQueryValue(searchParams, "musicAppleMusicId"),
        appleMusicUrl: getSingleQueryValue(searchParams, "musicAppleMusicUrl"),
        listeningNote: getSingleQueryValue(searchParams, "musicListeningNote"),
      },
    };
  }

  return {
    kind,
    data: {
      title: getSingleQueryValue(searchParams, "objectTitle") ?? "",
      slug: getSingleQueryValue(searchParams, "objectSlug"),
      heroImage: getSingleQueryValue(searchParams, "objectHeroImage"),
      brand: getSingleQueryValue(searchParams, "objectBrand"),
      model: getSingleQueryValue(searchParams, "objectModel"),
      category: getSingleQueryValue(searchParams, "objectCategory"),
      summary: getSingleQueryValue(searchParams, "objectSummary"),
      detailPath: getSingleQueryValue(searchParams, "objectSlug")
        ? `/updates/objects/${getSingleQueryValue(searchParams, "objectSlug")}`
        : null,
    },
  };
}
