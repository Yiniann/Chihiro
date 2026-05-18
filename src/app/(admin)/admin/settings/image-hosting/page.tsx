import { AssetProvider } from "@prisma/client";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { ImageHostingSettingsForm } from "@/app/(admin)/admin/settings/image-hosting/image-hosting-settings-form";
import { isOwnerAuthenticated } from "@/server/auth";
import { getObjectStorageSettings } from "@/server/repositories/object-storage";

export default async function AdminImageHostingSettingsPage() {
  const [settings, canEdit] = await Promise.all([
    getObjectStorageSettings(),
    isOwnerAuthenticated(),
  ]);
  const defaults = {
    provider: settings?.provider ?? AssetProvider.R2,
    endpoint: settings?.endpoint ?? "",
    region: settings?.region ?? "auto",
    bucket: settings?.bucket ?? "",
    accessKeyId: settings?.accessKeyId ?? "",
    publicBaseUrl: settings?.publicBaseUrl ?? "",
    keyPrefix: settings?.keyPrefix ?? "uploads/images",
    forcePathStyle: settings?.forcePathStyle ?? true,
    hasSecretAccessKey: Boolean(settings?.secretAccessKey),
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <AdminPageHeader eyebrow="图床" title="图床设置" />
      </div>
      <ImageHostingSettingsForm defaults={defaults} canEdit={canEdit} />
    </div>
  );
}
