CREATE TABLE "BookmarkCategoryItem" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "eyebrow" TEXT,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BookmarkCategoryItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookmarkCategoryItem_slug_key" ON "BookmarkCategoryItem"("slug");
CREATE INDEX "BookmarkCategoryItem_sortOrder_name_idx" ON "BookmarkCategoryItem"("sortOrder", "name");

INSERT INTO "BookmarkCategoryItem" ("name", "slug", "eyebrow", "description", "sortOrder", "updatedAt")
VALUES
  ('前端构建', 'frontend', 'Frontend', '组件、性能、框架和工程化里最常回看的资料。', 0, CURRENT_TIMESTAMP),
  ('设计参考', 'design', 'Design', '交互、排版、可访问性和视觉语言的灵感来源。', 1, CURRENT_TIMESTAMP),
  ('写作与表达', 'writing', 'Writing', '帮助内容更清楚、更耐读，也更有作者气息的文章。', 2, CURRENT_TIMESTAMP),
  ('产品与方法', 'product', 'Product', '产品判断、工作流设计和长期主义相关的收藏。', 3, CURRENT_TIMESTAMP);

ALTER TABLE "Bookmark" ADD COLUMN "categoryId" INTEGER;

UPDATE "Bookmark"
SET "categoryId" = category_map."id"
FROM (
  SELECT "id", "slug" FROM "BookmarkCategoryItem"
) AS category_map
WHERE
  ("Bookmark"."category" = 'FRONTEND' AND category_map."slug" = 'frontend')
  OR ("Bookmark"."category" = 'DESIGN' AND category_map."slug" = 'design')
  OR ("Bookmark"."category" = 'WRITING' AND category_map."slug" = 'writing')
  OR ("Bookmark"."category" = 'PRODUCT' AND category_map."slug" = 'product');

ALTER TABLE "Bookmark" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BookmarkCategoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Bookmark_categoryId_idx" ON "Bookmark"("categoryId");

DROP INDEX "Bookmark_isVisible_category_sortOrder_updatedAt_idx";
CREATE INDEX "Bookmark_isVisible_categoryId_sortOrder_updatedAt_idx" ON "Bookmark"("isVisible", "categoryId", "sortOrder", "updatedAt");

ALTER TABLE "Bookmark" DROP COLUMN "category";
