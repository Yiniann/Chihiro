import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { siteConfig } from "@/lib/site";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

export default async function AdminNewUpdatePage() {
  const ownerProfile = await getOwnerDisplayProfile();

  return (
    <UpdateEditorForm update={null} authorName={getOwnerDisplayName(ownerProfile, siteConfig.author)} />
  );
}
