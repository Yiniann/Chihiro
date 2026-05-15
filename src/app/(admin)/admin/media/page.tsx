import { StatCard } from "@/app/(admin)/admin/ui";
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
  const imageCount = assetsWithUsage.filter((asset) => asset.kind === "IMAGE").length;
  const videoCount = assetsWithUsage.filter((asset) => asset.kind === "VIDEO").length;
  const fileCount = assetsWithUsage.filter((asset) => asset.kind === "FILE").length;
  const usedAssetCount = assetsWithUsage.filter((asset) => asset.usageSummary.totalCount > 0).length;

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BoardStat>
          <StatCard label="全部媒体" value={assets.totalCount} />
        </BoardStat>
        <BoardStat>
          <StatCard label="图片" value={imageCount} />
        </BoardStat>
        <BoardStat>
          <StatCard label="视频与文件" value={videoCount + fileCount} />
        </BoardStat>
        <BoardStat>
          <StatCard label="已被引用" value={usedAssetCount} tone="neutral" />
        </BoardStat>
      </section>
      <MediaLibrary assets={assetsWithUsage} />
    </div>
  );
}

function BoardStat({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 px-5 py-4">{children}</div>;
}
