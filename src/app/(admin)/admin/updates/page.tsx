import {
  AdminUpdatesSection,
  filterAdminUpdates,
  filterVisibleAdminUpdates,
  getAdminQueryValue,
  getAdminSortValue,
  sortAdminUpdates,
} from "@/app/(admin)/admin/content-sections";
import { listUpdatesForAdmin } from "@/server/repositories/updates";

type AdminUpdatesPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
};

export default async function AdminUpdatesPage({ searchParams }: AdminUpdatesPageProps) {
  const { q, sort } = await searchParams;
  const activeSort = getAdminSortValue(sort);
  const query = getAdminQueryValue(q);
  const updates = await listUpdatesForAdmin();

  return (
    <AdminUpdatesSection
      items={filterAdminUpdates(filterVisibleAdminUpdates(sortAdminUpdates(updates, activeSort)), query)}
      sort={activeSort}
      query={query}
    />
  );
}
