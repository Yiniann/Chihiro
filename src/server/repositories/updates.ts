import { ContentStatus, Prisma } from "@prisma/client";
import { getParagraphsFromContent } from "@/lib/content";
import {
  isUpdateKindValue,
  type UpdateKindValue,
  type UpdateMetadata,
  type UpdateMovieMetadata,
  type UpdateMusicMetadata,
  type UpdateObjectMetadata,
} from "@/lib/update-kind";
import { siteConfig } from "@/lib/site";
import { prisma } from "@/server/db/client";

export type UpdateListSort = "latest" | "earliest" | "updated";

export type UpdateItem = {
  id: number;
  title: string;
  authorName: string;
  status: ContentStatus;
  kind: UpdateKindValue;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  metadata: UpdateMetadata;
  publishedAt: string | null;
  subscriptionEmailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  draftSnapshot: DraftUpdateSnapshot | null;
};

export type UpdateListResult = {
  items: UpdateItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type UpdateNavigationItem = {
  id: number;
  title: string;
  authorName: string;
  publishedAt: string | null;
};

type PublishedUpdateSnapshot = {
  title: string;
  authorName: string | null;
  kind: UpdateKindValue;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  metadata: UpdateMetadata;
  publishedAt: string | null;
};

type DraftUpdateSnapshot = PublishedUpdateSnapshot & {
  savedAt: string;
};

export type ListPublishedUpdatesOptions = {
  page?: number;
  pageSize?: number;
  sort?: UpdateListSort;
  query?: string;
};

export type SaveUpdateInput = {
  id?: number;
  kind: UpdateKindValue;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  metadata: UpdateMetadata;
  authorName: string | null;
  status: ContentStatus;
  publishedAt: Date | null;
};

type UpdateRow = {
  id: number;
  title: string;
  authorName: string | null;
  status: ContentStatus;
  kind: UpdateKindValue;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  metadata: Prisma.JsonValue | null;
  publishedAt: Date | null;
  subscriptionEmailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  draftSnapshot: Prisma.JsonValue | null;
};

type UpdateRecord = UpdateRow;

export async function listUpdatesForAdmin(): Promise<UpdateItem[]> {
  const items = await fetchUpdateRows(
    `
      SELECT id, title, "authorName", status, kind, content, "contentHtml", metadata, "publishedAt", "subscriptionEmailSentAt", "createdAt", "updatedAt", "draftSnapshot"
      FROM "Update"
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    `,
  );

  return items.map(mapUpdateRecord);
}

export async function getUpdateByIdForAdmin(id: number): Promise<UpdateItem | null> {
  const update = await fetchUpdateRowById(id);

  return update ? mapUpdateRecord(update) : null;
}

export async function listPublishedUpdates(
  options: ListPublishedUpdatesOptions = {},
): Promise<UpdateListResult> {
  const pageSize = getSafePageSize(options.pageSize);
  const page = getSafePage(options.page);
  const where = buildPublishedUpdateWhere(options);
  const [items, totalCount] = await Promise.all([
    fetchPublishedUpdateRows(options.sort, pageSize, page, where),
    prisma.update.count({ where }),
  ]);

  return {
    items: items.map(mapUpdateRecord),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function listAllPublishedUpdates(
  options: Omit<ListPublishedUpdatesOptions, "page" | "pageSize"> = {},
): Promise<UpdateItem[]> {
  const items = await fetchPublishedUpdateRows(options.sort);

  return items.map(mapUpdateRecord);
}

export async function listRecentPublishedUpdatesForNavigation(
  limit = 5,
): Promise<UpdateNavigationItem[]> {
  const items = await fetchPublishedUpdateRows("latest", limit, 1);

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    authorName: item.authorName ?? siteConfig.author,
    publishedAt: item.publishedAt?.toISOString() ?? null,
  }));
}

export async function saveUpdate(input: SaveUpdateInput): Promise<UpdateItem> {
  const current = typeof input.id === "number" ? await fetchUpdateRowById(input.id) : null;

  if (current && (current.status === ContentStatus.PUBLISHED || current.draftSnapshot)) {
    const resolvedTitle = resolveUpdateTitle(current.title, input.content, input.kind, input.metadata);
    const resolvedAuthorName = input.authorName ?? current.authorName;

    const draftSnapshot = buildDraftSnapshot({
      title: resolvedTitle,
      authorName: resolvedAuthorName,
      kind: input.kind,
      content: input.content,
      contentHtml: input.contentHtml,
      metadata: input.metadata,
      publishedAt: input.publishedAt,
    });

    const update = await prisma.update.update({
      where: { id: input.id },
      data: {
        draftSnapshot,
      },
    });

    await persistUpdateAuthorName(update.id, resolvedAuthorName);

    const refreshed = await fetchUpdateRowById(update.id);

    return mapUpdateRecord(refreshed ?? update);
  }

  const resolvedTitle = resolveUpdateTitle(current?.title ?? null, input.content, input.kind, input.metadata);
  const baseData = {
    title: resolvedTitle,
    kind: input.kind,
    content: input.content ?? Prisma.DbNull,
    contentHtml: input.contentHtml,
    metadata: serializeUpdateMetadata(input.metadata),
    publishedAt: input.publishedAt,
    status: input.status,
  };
  const updateData = {
    ...baseData,
    draftSnapshot: Prisma.DbNull,
  } satisfies Prisma.UpdateUpdateInput;
  const createData = {
    ...baseData,
  } satisfies Prisma.UpdateCreateInput;

  const update = current
    ? await prisma.update.update({
        where: { id: input.id },
        data: updateData,
      })
    : await prisma.update.create({
        data: createData,
      });

  await persistUpdateAuthorName(update.id, input.authorName);

  const refreshed = await fetchUpdateRowById(update.id);

  return mapUpdateRecord(refreshed ?? update);
}

export async function publishUpdateById(id: number): Promise<UpdateItem> {
  const current = await fetchUpdateRowById(id);

  if (!current) {
    throw new Error(`Update not found: ${id}`);
  }

  const draftSnapshot = parseDraftSnapshot(current.draftSnapshot);
  const publishedAt = current.publishedAt ?? new Date();
  const resolvedPublishedAt = draftSnapshot?.publishedAt ? new Date(draftSnapshot.publishedAt) : publishedAt;
  const resolvedAuthorName = draftSnapshot?.authorName ?? current.authorName;
  const updateData = draftSnapshot
    ? {
        title: draftSnapshot.title,
        kind: draftSnapshot.kind,
        content: draftSnapshot.content ?? Prisma.DbNull,
        contentHtml: draftSnapshot.contentHtml,
        metadata: serializeUpdateMetadata(draftSnapshot.metadata),
        publishedAt: resolvedPublishedAt,
      }
    : {
        title: current.title,
        kind: current.kind,
        content: current.content ?? Prisma.DbNull,
        contentHtml: current.contentHtml,
        metadata: (current.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
        publishedAt,
      };
  const update = await prisma.update.update({
    where: { id },
    data: {
      status: ContentStatus.PUBLISHED,
      ...updateData,
      publishedAt: resolvedPublishedAt,
      draftSnapshot: Prisma.DbNull,
    },
  });

  await persistUpdateAuthorName(update.id, resolvedAuthorName);

  const refreshed = await fetchUpdateRowById(update.id);

  return mapUpdateRecord(refreshed ?? update);
}

export async function markUpdateSubscriptionEmailSent(
  id: number,
  sentAt = new Date(),
): Promise<UpdateItem> {
  const update = await prisma.update.update({
    where: { id },
    data: {
      subscriptionEmailSentAt: sentAt,
    },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

export async function unpublishUpdateById(id: number): Promise<UpdateItem> {
  const update = await prisma.update.update({
    where: { id },
    data: {
      status: ContentStatus.DRAFT,
      publishedAt: null,
    },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

export async function deleteUpdateById(id: number): Promise<UpdateItem> {
  const update = await prisma.update.delete({
    where: { id },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

export async function moveUpdateToTrashById(id: number): Promise<UpdateItem> {
  const update = await prisma.update.update({
    where: { id },
    data: {
      status: ContentStatus.ARCHIVED,
    },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

export async function restoreUpdateFromTrashById(id: number): Promise<UpdateItem> {
  const update = await prisma.update.update({
    where: { id },
    data: {
      status: ContentStatus.DRAFT,
    },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

export async function discardUpdateRevisionById(id: number): Promise<UpdateItem> {
  const current = await fetchUpdateRowById(id);

  if (!current) {
    throw new Error(`Update not found: ${id}`);
  }

  if (!current.draftSnapshot) {
    throw new Error("这条动态没有可以删除的草稿。");
  }

  const draftSnapshot = parseDraftSnapshot(current.draftSnapshot);

  const update = await prisma.update.update({
    where: { id },
    data: {
      status: ContentStatus.PUBLISHED,
      publishedAt:
        draftSnapshot?.publishedAt ? new Date(draftSnapshot.publishedAt) : current.publishedAt ?? new Date(),
      draftSnapshot: Prisma.DbNull,
    },
  });

  return mapUpdateRecord(update as unknown as UpdateRow);
}

function buildPublishedUpdateWhere(
  options: ListPublishedUpdatesOptions,
): Prisma.UpdateWhereInput {
  const query = options.query?.trim();

  return {
    status: ContentStatus.PUBLISHED,
    ...(query
      ? {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              authorName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              contentHtml: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

function mapUpdateRecord(record: UpdateRecord): UpdateItem {
  const kind = record.kind as UpdateKindValue;

  return {
    id: record.id,
    title: record.title,
    authorName: record.authorName ?? siteConfig.author,
    status: record.status,
    kind,
    content: record.content,
    contentHtml: record.contentHtml,
    metadata: parseUpdateMetadata(kind, record.metadata ?? null),
    publishedAt: toIsoString(record.publishedAt),
    subscriptionEmailSentAt: toIsoString(record.subscriptionEmailSentAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    draftSnapshot: parseDraftSnapshot(record.draftSnapshot),
  };
}

async function fetchUpdateRows(sql: string) {
  return prisma.$queryRaw<Array<UpdateRow>>(Prisma.sql([sql]));
}

async function fetchUpdateRowById(id: number) {
  const rows = await prisma.$queryRaw<Array<UpdateRow>>(
    Prisma.sql`
      SELECT id, title, "authorName", status, kind, content, "contentHtml", metadata, "publishedAt", "subscriptionEmailSentAt", "createdAt", "updatedAt", "draftSnapshot"
      FROM "Update"
      WHERE id = ${id}
      LIMIT 1
    `,
  );

  return rows[0] ?? null;
}

async function fetchPublishedUpdateRows(
  sort?: UpdateListSort,
  pageSize?: number,
  page?: number,
  where?: Prisma.UpdateWhereInput,
) {
  const orderBySql =
    sort === "earliest"
      ? Prisma.sql`ORDER BY "publishedAt" ASC, "createdAt" ASC`
      : sort === "updated"
        ? Prisma.sql`ORDER BY "updatedAt" DESC`
        : Prisma.sql`ORDER BY "publishedAt" DESC, "createdAt" DESC`;

  const whereSql = buildPublishedUpdateWhereSql(where);
  const limitSql = typeof pageSize === "number" ? Prisma.sql`LIMIT ${pageSize}` : Prisma.empty;
  const offsetSql =
    typeof pageSize === "number" && typeof page === "number"
      ? Prisma.sql`OFFSET ${(page - 1) * pageSize}`
      : Prisma.empty;

  return prisma.$queryRaw<Array<UpdateRow>>(
    Prisma.sql`
      SELECT id, title, "authorName", status, kind, content, "contentHtml", metadata, "publishedAt", "subscriptionEmailSentAt", "createdAt", "updatedAt", "draftSnapshot"
      FROM "Update"
      ${whereSql}
      ${orderBySql}
      ${limitSql}
      ${offsetSql}
    `,
  );
}

function buildPublishedUpdateWhereSql(where?: Prisma.UpdateWhereInput) {
  if (!where) {
    return Prisma.sql`WHERE status = ${ContentStatus.PUBLISHED}`;
  }

  return Prisma.sql`WHERE status = ${ContentStatus.PUBLISHED}`;
}

function getSafePage(value?: number) {
  if (!value || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function getSafePageSize(value?: number) {
  if (!value || value < 1) {
    return 10;
  }

  return Math.min(Math.floor(value), 100);
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function buildDraftSnapshot(input: {
  title: string;
  authorName: string | null;
  kind: UpdateKindValue;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  metadata: UpdateMetadata;
  publishedAt: Date | null;
}): DraftUpdateSnapshot {
  const savedAt = new Date().toISOString();

  return {
    title: input.title,
    authorName: input.authorName,
    kind: input.kind,
    content: input.content,
    contentHtml: input.contentHtml,
    metadata: input.metadata,
    publishedAt: toIsoString(input.publishedAt),
    savedAt,
  };
}

function parseDraftSnapshot(value: Prisma.JsonValue | null): DraftUpdateSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Partial<PublishedUpdateSnapshot> & {
    savedAt?: unknown;
    updatedAt?: unknown;
    createdAt?: unknown;
  };

  const savedAt =
    typeof snapshot.savedAt === "string"
      ? snapshot.savedAt
      : typeof snapshot.updatedAt === "string"
        ? snapshot.updatedAt
        : typeof snapshot.createdAt === "string"
          ? snapshot.createdAt
          : null;

  if (!savedAt) {
    return null;
  }

  const kind = isUpdateKindValue(snapshot.kind) ? snapshot.kind : "NOTE";
  const snapshotMetadata = unwrapStoredMetadata(kind, (snapshot.metadata as Prisma.JsonValue | null) ?? null);

  return {
    title: snapshot.title ?? "",
    authorName: typeof snapshot.authorName === "string" ? snapshot.authorName : null,
    kind,
    content: snapshot.content ?? null,
    contentHtml: snapshot.contentHtml ?? null,
    metadata: parseUpdateMetadata(kind, kind === "NOTE" ? null : snapshotMetadata),
    publishedAt: snapshot.publishedAt ?? null,
    savedAt,
  };
}

function resolveUpdateTitle(
  currentTitle: string | null,
  content: Prisma.JsonValue | null,
  kind: UpdateKindValue,
  metadata: UpdateMetadata,
) {
  const metadataTitle = deriveTitleFromMetadata(kind, metadata);

  if (metadataTitle) {
    return metadataTitle;
  }

  const contentTitle = deriveTitleFromContent(content);
  if (contentTitle) {
    return contentTitle;
  }

  if (currentTitle) {
    return currentTitle;
  }

  return "未命名动态";
}

function deriveTitleFromMetadata(kind: UpdateKindValue, metadata: UpdateMetadata) {
  if (kind === "MOVIE" && metadata.kind === "MOVIE" && metadata.data.title.trim()) {
    return metadata.data.title.trim();
  }

  if (kind === "MUSIC" && metadata.kind === "MUSIC" && metadata.data.title.trim()) {
    return metadata.data.title.trim();
  }

  if (kind === "OBJECT" && metadata.kind === "OBJECT" && metadata.data.title.trim()) {
    return metadata.data.title.trim();
  }

  return null;
}

function deriveTitleFromContent(content: Prisma.JsonValue | null) {
  if (!content) {
    return null;
  }

  const firstLine = getParagraphsFromContent(content)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return null;
  }

  return truncateTitle(firstLine);
}

function truncateTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 24) {
    return normalized;
  }

  return `${normalized.slice(0, 24)}…`;
}

async function persistUpdateAuthorName(updateId: number, authorName: string | null) {
  if (!authorName) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Update"
    SET "authorName" = ${authorName}
    WHERE id = ${updateId}
  `;
}

function serializeUpdateMetadata(value: UpdateMetadata): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value.kind === "NOTE") {
    return Prisma.JsonNull;
  }

  return value.data as unknown as Prisma.InputJsonValue;
}

function parseUpdateMetadata(kind: UpdateKindValue, value: Prisma.JsonValue | null): UpdateMetadata {
  if (kind === "MOVIE") {
    return {
      kind,
      data: parseMovieMetadata(value),
    };
  }

  if (kind === "MUSIC") {
    return {
      kind,
      data: parseMusicMetadata(value),
    };
  }

  if (kind === "OBJECT") {
    return {
      kind,
      data: parseObjectMetadata(value),
    };
  }

  return {
    kind: "NOTE",
    data: null,
  };
}

function unwrapStoredMetadata(kind: UpdateKindValue, value: Prisma.JsonValue | null) {
  const record = asJsonObject(value);

  if (!record) {
    return value;
  }

  const wrappedKind = asString(record.kind);

  if (wrappedKind === kind && "data" in record) {
    return (record.data as Prisma.JsonValue | null) ?? null;
  }

  return value;
}

function parseMovieMetadata(value: Prisma.JsonValue | null): UpdateMovieMetadata {
  const record = asJsonObject(value);

  return {
    title: asString(record?.title) ?? "",
    originalTitle: asString(record?.originalTitle),
    year: asString(record?.year),
    posterUrl: asString(record?.posterUrl),
    director: asString(record?.director),
    genres: asStringArray(record?.genres),
    overview: asString(record?.overview),
    rating: asString(record?.rating),
    sourceName: asString(record?.sourceName),
    sourceUrl: asString(record?.sourceUrl),
  };
}

function parseMusicMetadata(value: Prisma.JsonValue | null): UpdateMusicMetadata {
  const record = asJsonObject(value);

  return {
    format: asString(record?.format),
    title: asString(record?.title) ?? "",
    artist: asString(record?.artist),
    album: asString(record?.album),
    releaseYear: asString(record?.releaseYear),
    coverUrl: asString(record?.coverUrl),
    genres: asStringArray(record?.genres),
    appleMusicId: asString(record?.appleMusicId),
    appleMusicUrl: asString(record?.appleMusicUrl),
    listeningNote: asString(record?.listeningNote),
  };
}

function parseObjectMetadata(value: Prisma.JsonValue | null): UpdateObjectMetadata {
  const record = asJsonObject(value);

  return {
    title: asString(record?.title) ?? "",
    slug: asString(record?.slug),
    heroImage: asString(record?.heroImage),
    brand: asString(record?.brand),
    model: asString(record?.model),
    category: asString(record?.category),
    summary: asString(record?.summary),
    detailPath: asString(record?.detailPath),
  };
}

function asJsonObject(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function asString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
