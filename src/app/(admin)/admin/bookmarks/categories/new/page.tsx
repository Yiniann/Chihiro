import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { BookmarkCategoryEditorForm } from "@/app/(admin)/admin/bookmarks/categories/[id]/bookmark-category-editor-form";

export default function AdminBookmarkCategoryNewPage() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <AdminPageHeader eyebrow="Bookmark Category" title="添加书签分类" />
      <BookmarkCategoryEditorForm />
    </div>
  );
}
