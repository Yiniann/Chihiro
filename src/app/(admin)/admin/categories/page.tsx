import { AdminTaxonomySection } from "@/app/(admin)/admin/content-sections";
import { listPostCategories } from "@/server/repositories/categories";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { listTags } from "@/server/repositories/tags";

export default async function AdminCategoriesPage() {
  const [postCategories, tags, posts] = await Promise.all([
    listPostCategories(),
    listTags(),
    listPostsForAdmin(),
  ]);

  return <AdminTaxonomySection postCategories={postCategories} tags={tags} posts={posts} />;
}
