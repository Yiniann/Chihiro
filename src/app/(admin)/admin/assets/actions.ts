"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth";
import { updateAssetAlt } from "@/server/repositories/assets";

export type SaveAssetAltState = {
  error: string | null;
  success: string | null;
};

export async function saveAssetAltAction(
  _previousState: SaveAssetAltState,
  formData: FormData,
): Promise<SaveAssetAltState> {
  await requireAdminSession();

  const assetId = formData.get("assetId");
  const alt = formData.get("alt");

  if (typeof assetId !== "string" || !assetId.trim()) {
    return {
      error: "缺少图片 ID。",
      success: null,
    };
  }

  try {
    await updateAssetAlt({
      id: assetId,
      alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存图片描述时出错了。",
      success: null,
    };
  }

  revalidatePath("/admin/assets");

  return {
    error: null,
    success: "图片描述已更新。",
  };
}
