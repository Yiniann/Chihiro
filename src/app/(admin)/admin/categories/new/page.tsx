import { AdminPageHeader } from "@/app/(admin)/admin/ui";
import { CategoryEditorForm } from "@/app/(admin)/admin/categories/[id]/category-editor-form";

export default function AdminCategoryNewPage() {
  return (
    <div className="grid gap-8">
      <AdminPageHeader eyebrow="Category" title="添加分类" />
      <CategoryEditorForm />
    </div>
  );
}
