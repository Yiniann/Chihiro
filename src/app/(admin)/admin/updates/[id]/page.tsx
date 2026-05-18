import { notFound } from "next/navigation";
import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { getUpdateByIdForAdmin } from "@/server/repositories/updates";
import { siteConfig } from "@/lib/site";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

type AdminUpdateDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUpdateDetailPage({ params }: AdminUpdateDetailPageProps) {
  const { id } = await params;
  const updateId = getUpdateId(id);

  if (updateId === null) {
    notFound();
  }

  const [update, ownerProfile] = await Promise.all([
    getUpdateByIdForAdmin(updateId),
    getOwnerDisplayProfile(),
  ]);

  if (!update) {
    notFound();
  }

  return (
    <UpdateEditorForm
      key={`${update.id}:${update.draftSnapshot?.savedAt ?? update.updatedAt}`}
      update={update}
      authorName={getOwnerDisplayName(ownerProfile, siteConfig.author)}
    />
  );
}

function getUpdateId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}
