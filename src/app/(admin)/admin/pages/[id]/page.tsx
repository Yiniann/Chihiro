import { notFound } from "next/navigation";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { StandalonePageEditorForm } from "@/app/(admin)/admin/compose/page/standalone-page-editor-form";
import { getSiteSettings } from "@/server/repositories/site";
import { getStandalonePageByIdForAdmin } from "@/server/repositories/standalone-pages";

type AdminStandalonePageDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminStandalonePageDetailPage({
  params,
}: AdminStandalonePageDetailPageProps) {
  const { id } = await params;
  const standalonePageId = getStandalonePageId(id);

  if (standalonePageId === null) {
    notFound();
  }

  const [standalonePage, siteSettings] = await Promise.all([
    getStandalonePageByIdForAdmin(standalonePageId),
    getSiteSettings(),
  ]);

  if (!standalonePage) {
    notFound();
  }

  return (
    <StandalonePageEditorForm
      key={`${standalonePage.id}:${standalonePage.draftSnapshot?.savedAt ?? standalonePage.updatedAt}`}
      standalonePage={standalonePage}
      siteUrlBase={resolveCanonicalSiteUrl(siteSettings)}
    />
  );
}

function getStandalonePageId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}
