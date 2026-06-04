CREATE TYPE "BookmarkCategory" AS ENUM ('FRONTEND', 'DESIGN', 'WRITING', 'PRODUCT');

CREATE TYPE "BookmarkKind" AS ENUM ('DOCS', 'ARTICLE', 'TOOL', 'COLLECTION');

CREATE TABLE "Bookmark" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "note" TEXT,
  "category" "BookmarkCategory" NOT NULL,
  "kind" "BookmarkKind" NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Bookmark_isVisible_category_sortOrder_updatedAt_idx"
ON "Bookmark"("isVisible", "category", "sortOrder", "updatedAt");

CREATE INDEX "Bookmark_isFeatured_isVisible_updatedAt_idx"
ON "Bookmark"("isFeatured", "isVisible", "updatedAt");
