import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { MediaLibrary } from "@/app/(admin)/admin/media/media-library";
import {
  getAssetUsageReferences,
  getAssetUsageSummary,
  listAssets,
} from "@/server/repositories/assets";

export default async function AdminMediaPage() {
  const assets = await listAssets({
    pageSize: 48,
  });
  const assetsWithUsage = await Promise.all(
    assets.items.map(async (asset) => ({
      ...asset,
      usageSummary: await getAssetUsageSummary(asset.id),
      usageReferences: await getAssetUsageReferences(asset.id),
    })),
  );

  return (
    <div className="grid gap-8">
      <AdminPageHeader eyebrow="Media" title="媒体库" />
      <MediaLibrary assets={assetsWithUsage} />
    </div>
  );
}
