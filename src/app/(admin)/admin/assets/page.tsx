import { AssetKind } from "@prisma/client";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime } from "@/app/(admin)/admin/utils";
import { AssetAltForm } from "@/app/(admin)/admin/assets/asset-alt-form";
import { listAssets } from "@/server/repositories/assets";

export default async function AdminAssetsPage() {
  const assets = await listAssets({
    kind: AssetKind.IMAGE,
    pageSize: 48,
  });

  return (
    <div className="grid gap-8">
      <AdminPageHeader eyebrow="Assets" title="图片" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.items.length > 0 ? (
          assets.items.map((asset) => (
            <article
              key={asset.id}
              className="border border-zinc-200/80 bg-white/72 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.alt ?? ""}
                className="aspect-[4/3] w-full rounded-2xl bg-zinc-100 object-contain dark:bg-zinc-900"
                loading="lazy"
                decoding="async"
              />

              <div className="mt-4 grid gap-3">
                <div className="grid gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {asset.storageKey}
                  </p>
                  <p>上传于 {formatAdminDateTime(asset.createdAt)}</p>
                  <p className="break-all">{asset.url}</p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Photo Meta
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words">
                    {asset.photoMeta ?? "未解析到拍摄信息"}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    URL
                  </p>
                  <p className="mt-1 break-all font-mono text-xs">{asset.url}</p>
                </div>

                <AssetAltForm assetId={asset.id} initialAlt={asset.alt} />
              </div>
            </article>
          ))
        ) : (
          <div className="border border-dashed border-zinc-200/80 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
            还没有已上传图片。
          </div>
        )}
      </section>
    </div>
  );
}
