import { AssetKind, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type AssetItem = {
  id: string;
  provider: string;
  kind: string;
  storageKey: string;
  bucket: string | null;
  url: string;
  title: string | null;
  alt: string | null;
  photoMeta: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetUsageSummary = {
  coverPostCount: number;
  postContentCount: number;
  updateContentCount: number;
  totalCount: number;
};

export type AssetUsageReference = {
  kind: "post-cover" | "post-content" | "update-content";
  id: number;
  title: string;
  href: string;
};

export async function getAssetById(id: string): Promise<AssetItem | null> {
  const asset = await prisma.asset.findUnique({
    where: { id },
  });

  return asset ? mapAsset(asset) : null;
}

export async function getAssetByStorageKey(storageKey: string): Promise<AssetItem | null> {
  const asset = await prisma.asset.findUnique({
    where: { storageKey },
  });

  return asset ? mapAsset(asset) : null;
}

export async function listAssets(params: {
  kind?: AssetKind;
  page?: number;
  pageSize?: number;
} = {}) {
  const page = getSafePage(params.page);
  const pageSize = getSafePageSize(params.pageSize);
  const where: Prisma.AssetWhereInput = {
    ...(params.kind ? { kind: params.kind } : {}),
  };
  const [items, totalCount] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: [{ createdAt: Prisma.SortOrder.desc }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    items: items.map(mapAsset),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function createAsset(input: {
  provider: Prisma.AssetCreateInput["provider"];
  kind: Prisma.AssetCreateInput["kind"];
  storageKey: string;
  bucket?: string | null;
  url: string;
  title?: string | null;
  alt?: string | null;
  photoMeta?: string | null;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}) {
  const asset = await prisma.asset.create({
    data: {
      provider: input.provider,
      kind: input.kind,
      storageKey: input.storageKey,
      bucket: input.bucket ?? null,
      url: input.url,
      title: input.title ?? null,
      alt: input.alt ?? null,
      photoMeta: input.photoMeta ?? null,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
    },
  });

  return mapAsset(asset);
}

export async function upsertAssetByStorageKey(input: {
  provider: Prisma.AssetCreateInput["provider"];
  kind: Prisma.AssetCreateInput["kind"];
  storageKey: string;
  bucket?: string | null;
  url: string;
  title?: string | null;
  alt?: string | null;
  photoMeta?: string | null;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}) {
  const asset = await prisma.asset.upsert({
    where: { storageKey: input.storageKey },
    update: {
      provider: input.provider,
      kind: input.kind,
      bucket: input.bucket ?? null,
      url: input.url,
      title: input.title ?? undefined,
      photoMeta: input.photoMeta ?? null,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
    },
    create: {
      provider: input.provider,
      kind: input.kind,
      storageKey: input.storageKey,
      bucket: input.bucket ?? null,
      url: input.url,
      title: input.title ?? null,
      alt: input.alt ?? null,
      photoMeta: input.photoMeta ?? null,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
    },
  });

  return mapAsset(asset);
}

export async function updateAssetMetadata(input: {
  id: string;
  title: string | null;
  alt: string | null;
}) {
  const asset = await prisma.asset.update({
    where: { id: input.id },
    data: {
      title: input.title,
      alt: input.alt,
    },
  });

  return mapAsset(asset);
}

export async function deleteAssetRecord(id: string) {
  await prisma.asset.delete({
    where: { id },
  });
}

export async function getAssetUsageSummary(id: string): Promise<AssetUsageSummary> {
  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true, url: true },
  });

  if (!asset) {
    throw new Error("媒体记录不存在。");
  }

  const coverPostCount = await prisma.post.count({
    where: {
      coverAssetId: asset.id,
    },
  });

  const escapedUrl = escapeLikePattern(asset.url);
  const urlPattern = `%${escapedUrl}%`;

  const [postContentResult] = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "Post"
    WHERE
      COALESCE("contentHtml", '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("content"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("draftSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("publishedSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
  `);

  const [updateContentResult] = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "Update"
    WHERE
      COALESCE("contentHtml", '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("content"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("draftSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
  `);

  const postContentCount = Number(postContentResult?.count ?? 0);
  const updateContentCount = Number(updateContentResult?.count ?? 0);

  return {
    coverPostCount,
    postContentCount,
    updateContentCount,
    totalCount: coverPostCount + postContentCount + updateContentCount,
  };
}

export async function getAssetUsageReferences(id: string): Promise<AssetUsageReference[]> {
  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true, url: true },
  });

  if (!asset) {
    throw new Error("媒体记录不存在。");
  }

  const escapedUrl = escapeLikePattern(asset.url);
  const urlPattern = `%${escapedUrl}%`;

  const coverPosts = await prisma.post.findMany({
    where: {
      coverAssetId: asset.id,
    },
    select: {
      id: true,
      title: true,
    },
    orderBy: [{ updatedAt: Prisma.SortOrder.desc }],
    take: 8,
  });

  const postContentRows = await prisma.$queryRaw<Array<{ id: number; title: string }>>(Prisma.sql`
    SELECT id, title
    FROM "Post"
    WHERE
      COALESCE("contentHtml", '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("content"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("draftSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("publishedSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
    ORDER BY "updatedAt" DESC
    LIMIT 8
  `);

  const updateContentRows = await prisma.$queryRaw<Array<{ id: number; title: string }>>(Prisma.sql`
    SELECT id, title
    FROM "Update"
    WHERE
      COALESCE("contentHtml", '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("content"::text, '') LIKE ${urlPattern} ESCAPE '\\'
      OR COALESCE("draftSnapshot"::text, '') LIKE ${urlPattern} ESCAPE '\\'
    ORDER BY "updatedAt" DESC
    LIMIT 8
  `);

  const references: AssetUsageReference[] = [
    ...coverPosts.map((post) => ({
      kind: "post-cover" as const,
      id: post.id,
      title: post.title,
      href: `/admin/posts/${encodeURIComponent(post.id)}`,
    })),
    ...postContentRows
      .filter((post) => !coverPosts.some((coverPost) => coverPost.id === post.id))
      .map((post) => ({
        kind: "post-content" as const,
        id: post.id,
        title: post.title,
        href: `/admin/posts/${encodeURIComponent(post.id)}`,
      })),
    ...updateContentRows.map((update) => ({
      kind: "update-content" as const,
      id: update.id,
      title: update.title,
      href: `/admin/updates/${encodeURIComponent(update.id)}`,
    })),
  ];

  return references;
}

function mapAsset(asset: Awaited<ReturnType<typeof prisma.asset.findUnique>> extends infer T
  ? T extends null
    ? never
    : NonNullable<T>
  : never): AssetItem {
  return {
    id: asset.id,
    provider: asset.provider,
    kind: asset.kind,
    storageKey: asset.storageKey,
    bucket: asset.bucket,
    url: asset.url,
    title: asset.title,
    alt: asset.alt,
    photoMeta: asset.photoMeta,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

function getSafePage(value?: number) {
  if (!value || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function getSafePageSize(value?: number) {
  if (!value || value < 1) {
    return 24;
  }

  return Math.min(Math.floor(value), 100);
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
