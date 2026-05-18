import { PostEditorForm } from "@/app/(admin)/admin/compose/post/post-editor-form";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { listPostCategories } from "@/server/repositories/categories";
import { getSiteSettings } from "@/server/repositories/site";
import { listTags } from "@/server/repositories/tags";
import { getOwnerDisplayName, getOwnerDisplayProfile } from "@/server/repositories/users";

export default async function AdminNewPostPage() {
  const [categories, tags, siteSettings, ownerProfile] = await Promise.all([
    listPostCategories(),
    listTags(),
    getSiteSettings(),
    getOwnerDisplayProfile(),
  ]);
  const siteUrlBase = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-6">
      <PostEditorForm
        key="new-post"
        post={null}
        categories={categories}
        tags={tags}
        siteUrlBase={siteUrlBase}
        authorName={getOwnerDisplayName(ownerProfile, siteConfig.author)}
      />
    </div>
  );
}
