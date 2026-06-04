import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { BookmarkEditorForm } from "@/app/(admin)/admin/bookmarks/[id]/bookmark-editor-form";
import { listBookmarkCategoriesForAdmin } from "@/server/repositories/bookmark-categories";

export default async function AdminBookmarkNewPage() {
  const categories = await listBookmarkCategoriesForAdmin();

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <AdminPageHeader eyebrow="Bookmark" title="添加书签" />
      {categories.length > 0 ? (
        <BookmarkEditorForm categories={categories} />
      ) : (
        <EmptyPanel text="请先创建至少一个书签分类。" />
      )}
    </div>
  );
}
