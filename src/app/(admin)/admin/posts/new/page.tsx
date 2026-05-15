import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { PostEditorForm } from "@/app/(admin)/admin/compose/post/post-editor-form";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { listPostCategories } from "@/server/repositories/categories";
import { getSiteSettings } from "@/server/repositories/site";
import { listTags } from "@/server/repositories/tags";

export default async function AdminNewPostPage() {
  const [categories, tags, siteSettings] = await Promise.all([
    listPostCategories(),
    listTags(),
    getSiteSettings(),
  ]);
  const siteUrlBase = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-8">
      <AdminPageHeader title="撰写新文章" />

      <PostEditorForm
        key="new-post"
        post={null}
        categories={categories}
        tags={tags}
        siteUrlBase={siteUrlBase}
        authorName={siteSettings?.authorName ?? siteConfig.author}
      />
    </div>
  );
}
