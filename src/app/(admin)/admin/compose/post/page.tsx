import { redirect } from "next/navigation";

type AdminComposePostPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function AdminComposePostPage({
  searchParams,
}: AdminComposePostPageProps) {
  const { id } = await searchParams;
  redirect(id && /^\d+$/.test(id) ? `/admin/posts/${encodeURIComponent(id)}` : "/admin/posts/new");
}
