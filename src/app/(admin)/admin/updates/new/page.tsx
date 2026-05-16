import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { getSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

export default async function AdminNewUpdatePage() {
  const siteSettings = await getSiteSettings();

  return (
    <UpdateEditorForm update={null} authorName={siteSettings?.authorName ?? siteConfig.author} />
  );
}
