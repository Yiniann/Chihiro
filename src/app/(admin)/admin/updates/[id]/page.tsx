import { notFound } from "next/navigation";
import { UpdateEditorForm } from "@/app/(admin)/admin/compose/update/update-editor-form";
import { getUpdateByIdForAdmin } from "@/server/repositories/updates";
import { getSiteSettings } from "@/server/repositories/site";
import { siteConfig } from "@/lib/site";

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

  const [update, siteSettings] = await Promise.all([
    getUpdateByIdForAdmin(updateId),
    getSiteSettings(),
  ]);

  if (!update) {
    notFound();
  }

  return (
    <UpdateEditorForm
      key={`${update.id}:${update.draftSnapshot?.savedAt ?? update.updatedAt}`}
      update={update}
      authorName={siteSettings?.authorName ?? siteConfig.author}
    />
  );
}

function getUpdateId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}
