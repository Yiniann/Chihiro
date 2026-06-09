export const updateKindValues = ["NOTE", "MOVIE", "MUSIC", "OBJECT"] as const;

export type UpdateKindValue = (typeof updateKindValues)[number];

export type UpdateMovieMetadata = {
  title: string;
  originalTitle: string | null;
  year: string | null;
  posterUrl: string | null;
  director: string | null;
  genres: string[];
  overview: string | null;
  rating: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

export type UpdateMusicMetadata = {
  format: string | null;
  title: string;
  artist: string | null;
  album: string | null;
  releaseYear: string | null;
  coverUrl: string | null;
  genres: string[];
  appleMusicId: string | null;
  appleMusicUrl: string | null;
  listeningNote: string | null;
};

export type UpdateObjectMetadata = {
  title: string;
  slug: string | null;
  heroImage: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  summary: string | null;
  detailPath: string | null;
};

export type UpdateMetadata =
  | { kind: "NOTE"; data: null }
  | { kind: "MOVIE"; data: UpdateMovieMetadata }
  | { kind: "MUSIC"; data: UpdateMusicMetadata }
  | { kind: "OBJECT"; data: UpdateObjectMetadata };

export const updateKindOptions: Array<{
  value: UpdateKindValue;
  label: string;
  description: string;
}> = [
  {
    value: "NOTE",
    label: "普通动态",
    description: "只写短动态，不附带额外内容卡。",
  },
  {
    value: "MOVIE",
    label: "电影鉴赏",
    description: "短评加电影信息卡，点击跳外部页面。",
  },
  {
    value: "MUSIC",
    label: "音乐鉴赏",
    description: "短评加 Apple Music 卡，点击跳 Apple Music。",
  },
  {
    value: "OBJECT",
    label: "物品鉴赏",
    description: "短评加物品卡，可进入站内详情页。",
  },
];

export function isUpdateKindValue(value: string | null | undefined): value is UpdateKindValue {
  return updateKindValues.includes(value as UpdateKindValue);
}

export function getUpdateKindLabel(value: UpdateKindValue) {
  return updateKindOptions.find((option) => option.value === value)?.label ?? value;
}
