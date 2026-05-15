import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { getSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export default async function AdminNewUpdatePage() {
  const siteSettings = await getSiteSettings();

  return (
    <div className="grid gap-8">
      <AdminPageHeader title="撰写新动态" />

      <UpdateEditorForm update={null} authorName={siteSettings?.authorName ?? siteConfig.author} />
    </div>
  );
}
