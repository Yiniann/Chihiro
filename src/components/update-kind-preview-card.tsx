"use client";

import Link from "next/link";
import { ArrowUpRight, Disc3, Film, Package2 } from "lucide-react";
import type { UpdateMetadata, UpdateKindValue, UpdateMovieMetadata } from "@/lib/update-kind";

export function UpdateKindPreviewCard({
  kind,
  metadata,
  interactive = true,
  className = "",
}: {
  kind: UpdateKindValue;
  metadata: UpdateMetadata;
  interactive?: boolean;
  className?: string;
}) {
  if (kind === "MOVIE" && metadata.kind === "MOVIE") {
    const format = resolveMovieFormat(metadata.data);
    const episodeCode = resolveEpisodeCode(metadata.data);
    const selectionMode = resolveMovieSelectionMode(metadata.data);
    const sourceLabel = resolveMovieSourceLabel(metadata.data);
    const title = metadata.data.title || "未命名影视";
    const subtitle =
      selectionMode === "episode"
        ? ["单集", episodeCode, metadata.data.episodeTitle].filter(Boolean).join(" · ")
        : selectionMode === "season"
          ? ["季度", resolveSeasonCode(metadata.data), metadata.data.seasonName].filter(Boolean).join(" · ")
        : metadata.data.originalTitle ?? metadata.data.director ?? "";
    const kicker = `${format} · ${metadata.data.year ?? "Unknown"}`;
    const inner = (
      <>
        <PosterBlock
          tone="amber"
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          imageUrl={metadata.data.posterUrl ?? undefined}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                {kicker}
              </p>
              <p className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.35rem]">
                {title}
              </p>
              {subtitle ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {interactive ? (
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-200" />
            ) : null}
          </div>
          {metadata.data.overview ? (
            <p className="mt-2.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{metadata.data.overview}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2.5 text-sm text-zinc-500 dark:text-zinc-400">
            {metadata.data.rating ? (
              <span className="inline-flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                <Film className="h-4 w-4" />
                <span className="text-primary">{metadata.data.rating}</span>
              </span>
            ) : null}
            {selectionMode === "episode" ? <span>单集</span> : null}
            {selectionMode === "season" ? <span>季度</span> : null}
            {metadata.data.seasonName && selectionMode === "season" ? <span>{metadata.data.seasonName}</span> : null}
            {metadata.data.genres.length > 0 ? <span>{metadata.data.genres.join(" · ")}</span> : null}
            {sourceLabel ? <span>{sourceLabel}</span> : null}
          </div>
        </div>
      </>
    );

    return renderCardShell({
      href: metadata.data.sourceUrl ?? undefined,
      interactive,
      className,
      layoutClassName: "sm:grid-cols-[7.5rem_minmax(0,1fr)]",
      children: inner,
    });
  }

  if (kind === "MUSIC" && metadata.kind === "MUSIC") {
    const inner = (
      <>
        <SquareBlock
          tone="violet"
          kicker={`${metadata.data.format ?? "Music"} · ${metadata.data.releaseYear ?? "Unknown"}`}
          title={metadata.data.title || "未命名曲目"}
          subtitle={metadata.data.artist ?? ""}
          imageUrl={metadata.data.coverUrl ?? undefined}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                {metadata.data.format ?? "Music"} · {metadata.data.releaseYear ?? "Unknown"}
              </p>
              <p className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.35rem]">
                {metadata.data.title || "未命名曲目"}
              </p>
              {metadata.data.artist ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{metadata.data.artist}</p>
              ) : null}
            </div>
            {interactive ? (
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-200" />
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            {metadata.data.genres.length > 0 ? (
              <span className="inline-flex items-center gap-2">
                <Disc3 className="h-4 w-4" />
                {metadata.data.genres.join(" · ")}
              </span>
            ) : null}
            {metadata.data.album ? <span>{metadata.data.album}</span> : null}
            <span>Apple Music</span>
          </div>
        </div>
      </>
    );

    return renderCardShell({
      href: metadata.data.appleMusicUrl ?? undefined,
      interactive,
      className,
      layoutClassName: "sm:grid-cols-[6.75rem_minmax(0,1fr)]",
      children: inner,
    });
  }

  if (kind === "OBJECT" && metadata.kind === "OBJECT") {
    const href = metadata.data.detailPath ?? undefined;
    const inner = (
      <>
        <BannerBlock
          tone="emerald"
          kicker={`Object · ${metadata.data.category ?? "Daily Use"}`}
          title={metadata.data.title || "未命名物品"}
          subtitle={[metadata.data.brand, metadata.data.model].filter(Boolean).join(" · ")}
          imageUrl={metadata.data.heroImage ?? undefined}
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[1.35rem]">
              {metadata.data.title || "未命名物品"}
            </p>
            {metadata.data.summary ? (
              <p className="mt-2.5 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {metadata.data.summary}
              </p>
            ) : null}
          </div>
          {href ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-zinc-600 transition group-hover:text-zinc-950 dark:bg-zinc-950 dark:text-zinc-300 dark:group-hover:text-zinc-50">
              查看全文
              <ArrowUpRight className="h-4 w-4" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
              <Package2 className="h-4 w-4" />
              详情页待接入
            </span>
          )}
        </div>
      </>
    );

    return renderCardShell({
      href,
      interactive: interactive && Boolean(href),
      className,
      layoutClassName: "",
      children: inner,
    });
  }

  return null;
}

function resolveMovieFormat(metadata: UpdateMovieMetadata) {
  if (metadata.format === "TV" || metadata.format === "Movie") {
    return metadata.format;
  }

  if (metadata.sourceName === "TMDB TV" || metadata.sourceUrl?.includes("/tv/")) {
    return "TV";
  }

  return "Movie";
}

function resolveEpisodeCode(metadata: UpdateMovieMetadata) {
  if (!metadata.seasonNumber || !metadata.episodeNumber) {
    return null;
  }

  return `S${metadata.seasonNumber.padStart(2, "0")}E${metadata.episodeNumber.padStart(2, "0")}`;
}

function resolveSeasonCode(metadata: UpdateMovieMetadata) {
  if (!metadata.seasonNumber) {
    return null;
  }

  return `S${metadata.seasonNumber.padStart(2, "0")}`;
}

function resolveMovieSourceLabel(metadata: UpdateMovieMetadata) {
  if (metadata.sourceName === "TMDB" || metadata.sourceName === "TMDB TV") {
    return "TMDB";
  }

  return metadata.sourceName;
}

function resolveMovieSelectionMode(metadata: UpdateMovieMetadata) {
  if (metadata.seasonNumber && metadata.episodeNumber) {
    return "episode";
  }

  if (metadata.seasonNumber) {
    return "season";
  }

  return "work";
}

function renderCardShell({
  href,
  interactive,
  className,
  layoutClassName,
  children,
}: {
  href?: string;
  interactive: boolean;
  className: string;
  layoutClassName: string;
  children: React.ReactNode;
}) {
  const classes = [
    "group grid gap-3 rounded-[1.4rem] border border-zinc-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]",
    interactive ? "transition hover:border-zinc-300 hover:bg-white/90 dark:hover:border-white/20 dark:hover:bg-[rgba(255,255,255,0.08)]" : "",
    layoutClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (interactive && href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
        {children}
      </a>
    );
  }

  return <div className={classes}>{children}</div>;
}

function PosterBlock({
  tone,
  kicker,
  title,
  subtitle,
  imageUrl,
}: {
  tone: "amber" | "violet" | "emerald";
  kicker: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative min-h-[11rem] overflow-hidden rounded-[1.1rem] border border-zinc-200/80 dark:border-zinc-800/80">
        <img src={imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-[11rem] overflow-hidden rounded-[1.1rem] border ${getToneClasses(tone)}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))]" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/72">{kicker}</p>
        <div>
          <p className="text-base font-semibold tracking-tight text-white">{title}</p>
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SquareBlock(props: {
  tone: "amber" | "violet" | "emerald";
  kicker: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}) {
  if (props.imageUrl) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[1.1rem] border border-zinc-200/80 dark:border-zinc-800/80">
        <img src={props.imageUrl} alt={props.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative aspect-square overflow-hidden rounded-[1.1rem] border ${getToneClasses(props.tone)}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))]" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/72">{props.kicker}</p>
        <div>
          <p className="text-base font-semibold tracking-tight text-white">{props.title}</p>
          <p className="mt-1 text-sm text-white/75">{props.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function BannerBlock(props: {
  tone: "amber" | "violet" | "emerald";
  kicker: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}) {
  if (props.imageUrl) {
    return (
      <div className="relative min-h-[9.5rem] overflow-hidden rounded-[1.15rem] border border-zinc-200/80 dark:border-zinc-800/80">
        <img src={props.imageUrl} alt={props.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-[9.5rem] overflow-hidden rounded-[1.15rem] border ${getToneClasses(props.tone)}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.46),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(0,0,0,0.18))]" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/72">{props.kicker}</p>
        <div>
          <p className="text-xl font-semibold tracking-tight text-white">{props.title}</p>
          <p className="mt-2 text-sm text-white/75">{props.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function getToneClasses(tone: "amber" | "violet" | "emerald") {
  if (tone === "amber") {
    return "border-amber-200/70 bg-[linear-gradient(135deg,#8b5e3c_0%,#d59f6a_46%,#f0d9ae_100%)]";
  }

  if (tone === "violet") {
    return "border-violet-200/70 bg-[linear-gradient(135deg,#2d1d54_0%,#6f59b3_48%,#d1c0ff_100%)]";
  }

  return "border-emerald-200/70 bg-[linear-gradient(135deg,#0f3f34_0%,#2f7f68_48%,#d6eee1_100%)]";
}
