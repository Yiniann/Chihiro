import { redirect } from "next/navigation";

type AdminComposeUpdatePageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function AdminComposeUpdatePage({
  searchParams,
}: AdminComposeUpdatePageProps) {
  const { id } = await searchParams;
  redirect(
    id && /^\d+$/.test(id) ? `/admin/updates/${encodeURIComponent(id)}` : "/admin/updates/new",
  );
}
