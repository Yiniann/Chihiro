import { AssetKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/auth";
import { createAsset } from "@/server/repositories/assets";
import { getObjectStorageSettings } from "@/server/repositories/object-storage";
import { resolveImageUrlPhotoMeta, uploadImageToObjectStorage } from "@/server/object-storage";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "请先登录后台。" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择要上传的图片。" }, { status: 400 });
    }

    const uploadedImage = await uploadImageToObjectStorage(file);
    const resolvedMeta =
      uploadedImage.photoMeta ?? (await resolveImageUrlPhotoMeta(uploadedImage.url));
    const objectStorageSettings = await getObjectStorageSettings();

    if (objectStorageSettings) {
      await createAsset({
        provider: objectStorageSettings.provider,
        kind: AssetKind.IMAGE,
        storageKey: uploadedImage.storageKey,
        bucket: objectStorageSettings.bucket,
        url: uploadedImage.url,
        alt: null,
        photoMeta: resolvedMeta ?? null,
        mimeType: file.type || null,
        size: file.size,
      });
    }

    return NextResponse.json({
      url: uploadedImage.url,
      meta: resolvedMeta,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "上传图片时出错了。",
      },
      { status: 400 },
    );
  }
}
