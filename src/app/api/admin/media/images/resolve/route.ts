import { AssetKind, AssetProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/auth";
import { upsertAssetByStorageKey } from "@/server/repositories/assets";
import { getObjectStorageSettings } from "@/server/repositories/object-storage";
import {
  getAssetTitleFromUrl,
  getStorageKeyFromPublicUrl,
  resolveImageUrlPhotoMeta,
} from "@/server/object-storage";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "请先登录后台。" }, { status: 401 });
  }

  let url: string | null = null;

  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body.url === "string" ? body.url.trim() : null;
  } catch {
    return NextResponse.json({ error: "请求格式无效。" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "缺少图片 URL。" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "只支持 http 或 https 图片地址。" }, { status: 400 });
    }

    const normalizedUrl = parsedUrl.toString();
    const meta = await resolveImageUrlPhotoMeta(normalizedUrl);
    const objectStorageSettings = await getObjectStorageSettings();
    const matchedStorageKey = objectStorageSettings
      ? getStorageKeyFromPublicUrl(objectStorageSettings.publicBaseUrl, normalizedUrl)
      : null;
    const storageKey =
      matchedStorageKey ??
      `external/${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;

    await upsertAssetByStorageKey({
      provider: objectStorageSettings?.provider ?? AssetProvider.LOCAL,
      kind: AssetKind.IMAGE,
      storageKey,
      bucket: matchedStorageKey ? (objectStorageSettings?.bucket ?? null) : null,
      url: normalizedUrl,
      title: getAssetTitleFromUrl(normalizedUrl),
      alt: null,
      photoMeta: meta ?? null,
    });

    return NextResponse.json({
      meta: meta ?? null,
      registered: true,
      storageKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "图片 URL 无效。",
      },
      { status: 400 },
    );
  }
}
