"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveMediaSettingsAction,
  type SaveMediaSettingsState,
} from "@/app/(admin)/admin/settings/media/actions";
import { useToast } from "@/components/toast-provider";

const initialState: SaveMediaSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

type SourceOption = {
  value: string;
  label: string;
  enabled: boolean;
};

const MOVIE_SOURCES: SourceOption[] = [
  { value: "tmdb", label: "TMDB", enabled: true },
  { value: "other", label: "其他", enabled: false },
];

const MUSIC_SOURCES: SourceOption[] = [
  { value: "apple-music", label: "Apple Music", enabled: true },
  { value: "other", label: "其他", enabled: false },
];

const OBJECT_SOURCES: SourceOption[] = [
  { value: "manual", label: "手动录入", enabled: false },
];

const BOOK_SOURCES: SourceOption[] = [
  { value: "manual", label: "手动录入", enabled: false },
];

export function MediaSettingsForm({
  defaultTmdbApiKey,
  defaultMovieSource,
  defaultMusicSource,
}: {
  defaultTmdbApiKey: string;
  defaultMovieSource: string;
  defaultMusicSource: string;
}) {
  const [state, formAction] = useActionState(saveMediaSettingsAction, initialState);
  const [movieSource, setMovieSource] = useState(defaultMovieSource || "tmdb");
  const [musicSource, setMusicSource] = useState(defaultMusicSource || "apple-music");
  useSettingsToast(state);

  return (
    <form id="media-settings-form" action={formAction} className="grid gap-5 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
      <input type="hidden" name="movieSource" value={movieSource} />
      <input type="hidden" name="musicSource" value={musicSource} />

      <SectionTitle title="内容源" />

      <div className="grid gap-3 border-b border-zinc-200/80 py-5 dark:border-zinc-800/80">
        <SourceRow
          label="电影"
          options={MOVIE_SOURCES}
          value={movieSource}
          onChange={setMovieSource}
        />
        {movieSource === "tmdb" ? (
          <ConfigRow
            content={
              <input
                name="tmdbApiKey"
                type="password"
                autoComplete="off"
                defaultValue={defaultTmdbApiKey}
                className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                placeholder="TMDB API Key"
              />
            }
          />
        ) : (
          <ConfigRow content={<ReadonlyField text="这个内容源还没接入。" />} />
        )}

        <SourceRow
          label="音乐"
          options={MUSIC_SOURCES}
          value={musicSource}
          onChange={setMusicSource}
        />
        {musicSource === "apple-music" ? (
          <ConfigRow
            content={<ReadonlyField text="当前使用 Apple Music 搜索结果。" />}
          />
        ) : (
          <ConfigRow content={<ReadonlyField text="这个内容源还没接入。" />} />
        )}

        <SourceRow
          label="物件"
          options={OBJECT_SOURCES}
          value="manual"
          onChange={() => {}}
        />
        <ConfigRow content={<ReadonlyField text="这个内容源还没接入。" />} />

        <SourceRow
          label="书籍"
          options={BOOK_SOURCES}
          value="manual"
          onChange={() => {}}
        />
        <ConfigRow content={<ReadonlyField text="这个内容源还没接入。" />} />
      </div>
    </form>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[2rem] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
    </div>
  );
}

function SourceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SourceOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-zinc-200/70 pb-3 dark:border-zinc-800/70">
      <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
        <div className="px-1 text-base font-medium text-zinc-950 dark:text-zinc-50">{label}</div>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:focus:border-zinc-600"
        >
          {options.map((item) => (
            <option key={item.value} value={item.value} disabled={!item.enabled}>
              {item.enabled ? item.label : `${item.label}（即将开放）`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConfigRow({ content }: { content: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-zinc-200/70 pb-6 dark:border-zinc-800/70">
      <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
        <div />
        {content}
      </div>
    </div>
  );
}

function ReadonlyField({ text }: { text: string }) {
  return (
    <div className="flex h-11 w-full items-center rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-400">
      {text}
    </div>
  );
}

function useSettingsToast(state: SaveMediaSettingsState) {
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
    }
  }, [showToast, state.error, state.nonce, state.success]);
}
