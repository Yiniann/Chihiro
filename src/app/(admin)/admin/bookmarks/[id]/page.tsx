import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { BookmarkEditorForm } from "@/app/(admin)/admin/bookmarks/[id]/bookmark-editor-form";
import { listBookmarkCategoriesForAdmin } from "@/server/repositories/bookmark-categories";
import { getBookmarkByIdForAdmin } from "@/server/repositories/bookmarks";

type AdminBookmarkPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminBookmarkPage({ params }: AdminBookmarkPageProps) {
  const { id } = await params;
  const bookmarkId = Number.parseInt(id, 10);

  if (Number.isNaN(bookmarkId)) {
    notFound();
  }

  const bookmark = await getBookmarkByIdForAdmin(bookmarkId);
  const categories = await listBookmarkCategoriesForAdmin();

  if (!bookmark) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <AdminPageHeader eyebrow="Bookmark" title="编辑书签" />
      {categories.length > 0 ? (
        <BookmarkEditorForm bookmark={bookmark} categories={categories} />
      ) : (
        <EmptyPanel text="请先创建至少一个书签分类。" />
      )}
    </div>
  );
}
