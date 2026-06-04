import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { BookmarkCategoryEditorForm } from "@/app/(admin)/admin/bookmarks/categories/[id]/bookmark-category-editor-form";
import { getBookmarkCategoryByIdForAdmin } from "@/server/repositories/bookmark-categories";

type AdminBookmarkCategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminBookmarkCategoryPage({
  params,
}: AdminBookmarkCategoryPageProps) {
  const { id } = await params;
  const categoryId = Number.parseInt(id, 10);

  if (Number.isNaN(categoryId)) {
    notFound();
  }

  const category = await getBookmarkCategoryByIdForAdmin(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <AdminPageHeader eyebrow="Bookmark Category" title="编辑书签分类" />
      <BookmarkCategoryEditorForm category={category} />
    </div>
  );
}
