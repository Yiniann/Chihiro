CREATE TYPE "StandalonePageNavGroup" AS ENUM ('HOME', 'MORE');

CREATE TABLE "StandalonePage" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "content" JSONB,
  "contentHtml" TEXT,
  "publishedAt" TIMESTAMP(3),
  "draftSnapshot" JSONB,
  "showInNav" BOOLEAN NOT NULL DEFAULT false,
  "navLabel" TEXT,
  "navGroup" "StandalonePageNavGroup" NOT NULL DEFAULT 'HOME',
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StandalonePage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StandalonePage_slug_key" ON "StandalonePage"("slug");
CREATE INDEX "StandalonePage_status_publishedAt_idx" ON "StandalonePage"("status", "publishedAt");
CREATE INDEX "StandalonePage_showInNav_navGroup_status_publishedAt_idx" ON "StandalonePage"("showInNav", "navGroup", "status", "publishedAt");
