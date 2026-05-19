import { resolveCanonicalSiteUrl } from "@/lib/site";
import { StandalonePageEditorForm } from "@/app/(admin)/admin/compose/page/standalone-page-editor-form";
import { getSiteSettings } from "@/server/repositories/site";

export default async function AdminNewStandalonePage() {
  const siteSettings = await getSiteSettings();

  return (
    <StandalonePageEditorForm
      standalonePage={null}
      siteUrlBase={resolveCanonicalSiteUrl(siteSettings)}
    />
  );
}
