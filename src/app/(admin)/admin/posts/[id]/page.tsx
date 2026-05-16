import { notFound } from "next/navigation";
import { PostEditorForm } from "@/app/(admin)/admin/compose/post/post-editor-form";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { listPostCategories } from "@/server/repositories/categories";
import { getPostByIdForAdmin } from "@/server/repositories/posts";
import { getSiteSettings } from "@/server/repositories/site";
import { listTags } from "@/server/repositories/tags";

type AdminPostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminPostDetailPage({ params }: AdminPostDetailPageProps) {
  const { id } = await params;
  const postId = getPostId(id);

  if (postId === null) {
    notFound();
  }

  const [post, categories, tags, siteSettings] = await Promise.all([
    getPostByIdForAdmin(postId),
    listPostCategories(),
    listTags(),
    getSiteSettings(),
  ]);

  if (!post) {
    notFound();
  }

  const siteUrlBase = resolveCanonicalSiteUrl(siteSettings);

  return (
    <div className="grid gap-6">
      <PostEditorForm
        key={`${post.id}:${post.draftSnapshot?.savedAt ?? post.updatedAt}`}
        post={post}
        categories={categories}
        tags={tags}
        siteUrlBase={siteUrlBase}
        authorName={siteSettings?.authorName ?? siteConfig.author}
      />
    </div>
  );
}

function getPostId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}
