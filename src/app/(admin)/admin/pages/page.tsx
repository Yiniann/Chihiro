import {
  AdminPagesSection,
  filterAdminStandalonePages,
  getAdminQueryValue,
  getAdminSortValue,
  sortAdminStandalonePages,
} from "@/app/(admin)/admin/content-sections";
import { listStandalonePagesForAdmin } from "@/server/repositories/standalone-pages";

type AdminPagesPageProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
  }>;
};

export default async function AdminPagesPage({ searchParams }: AdminPagesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sort = getAdminSortValue(resolvedSearchParams?.sort);
  const query = getAdminQueryValue(resolvedSearchParams?.q);
  const items = listStandalonePagesForAdmin();
  const visibleItems = filterAdminStandalonePages(sortAdminStandalonePages(await items, sort), query);

  return <AdminPagesSection items={visibleItems} sort={sort} query={query} />;
}
