import Link from "next/link";
import {
  AdminCategoriesSection,
  AdminTagsSection,
} from "@/app/(admin)/admin/content-sections";
import { listPostCategories } from "@/server/repositories/categories";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { listTags } from "@/server/repositories/tags";

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const { tab } = await searchParams;
  const [postCategories, tags, posts] = await Promise.all([
    listPostCategories(),
    listTags(),
    listPostsForAdmin(),
  ]);
  const activeTab = tab === "tags" ? "tags" : "categories";

  return (
    <div className="grid gap-5">
      <section className="border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
        <div className="grid w-full grid-cols-2 gap-2">
        <TabLink
          href="/admin/categories?tab=categories"
          active={activeTab === "categories"}
          label={`分类 ${postCategories.length}`}
        />
        <TabLink
          href="/admin/categories?tab=tags"
          active={activeTab === "tags"}
          label={`标签 ${tags.length}`}
        />
        </div>
      </section>

      {activeTab === "categories" ? (
        <AdminCategoriesSection postCategories={postCategories} />
      ) : (
        <AdminTagsSection tags={tags} posts={posts} />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-10 w-full items-center justify-center rounded-2xl px-3 text-sm font-medium transition",
        active
          ? "bg-primary/10 text-primary"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
