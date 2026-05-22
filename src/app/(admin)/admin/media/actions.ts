"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth";
import {
  deleteAssetRecord,
  getAssetUsageSummary,
  updateAssetMetadata,
} from "@/server/repositories/assets";

export type SaveMediaMetadataState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export async function saveMediaMetadataAction(
  _previousState: SaveMediaMetadataState,
  formData: FormData,
): Promise<SaveMediaMetadataState> {
  await requireAdminSession();

  const assetId = formData.get("assetId");
  const title = formData.get("title");
  const alt = formData.get("alt");

  if (typeof assetId !== "string" || !assetId.trim()) {
    return {
      error: "缺少媒体 ID。",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    await updateAssetMetadata({
      id: assetId,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存媒体信息时出错了。",
      success: null,
      nonce: Date.now(),
    };
  }

  revalidatePath("/admin/media");

  return {
    error: null,
    success: "媒体信息已更新。",
    nonce: Date.now(),
  };
}

export async function removeMediaRecordAction(formData: FormData) {
  await requireAdminSession();

  const assetId = formData.get("assetId");

  if (typeof assetId !== "string" || !assetId.trim()) {
    throw new Error("缺少媒体记录 ID。");
  }

  const usage = await getAssetUsageSummary(assetId);

  if (usage.totalCount > 0) {
    const reasons = [
      usage.coverPostCount > 0 ? `${usage.coverPostCount} 篇文章封面` : null,
      usage.postContentCount > 0 ? `${usage.postContentCount} 篇文章正文或草稿` : null,
      usage.updateContentCount > 0 ? `${usage.updateContentCount} 条动态正文或草稿` : null,
    ].filter(Boolean);

    throw new Error(`这条媒体仍被 ${reasons.join("、")} 引用，不能移出媒体库。`);
  }

  await deleteAssetRecord(assetId);
  revalidatePath("/admin/media");
}
