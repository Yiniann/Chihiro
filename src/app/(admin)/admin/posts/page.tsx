import {
  AdminPostsSection,
  filterAdminPosts,
  filterVisibleAdminPosts,
  getAdminQueryValue,
  getAdminSortValue,
  sortAdminPosts,
} from "@/app/(admin)/admin/content-sections";
import { listPostsForAdmin } from "@/server/repositories/posts";

type AdminPostsPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
};

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const { q, sort } = await searchParams;
  const activeSort = getAdminSortValue(sort);
  const query = getAdminQueryValue(q);
  const posts = await listPostsForAdmin();

  return (
    <AdminPostsSection
      items={filterAdminPosts(filterVisibleAdminPosts(sortAdminPosts(posts, activeSort)), query)}
      sort={activeSort}
      query={query}
    />
  );
}
