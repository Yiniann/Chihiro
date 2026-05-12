ALTER TABLE "PostComment"
ADD COLUMN "threadRootId" TEXT;

WITH RECURSIVE "CommentRoots" AS (
  SELECT
    "id",
    "parentId",
    "id" AS "rootId"
  FROM "PostComment"
  WHERE "parentId" IS NULL

  UNION ALL

  SELECT
    child."id",
    child."parentId",
    roots."rootId"
  FROM "PostComment" child
  INNER JOIN "CommentRoots" roots ON child."parentId" = roots."id"
)
UPDATE "PostComment" comment
SET "threadRootId" = roots."rootId"
FROM "CommentRoots" roots
WHERE comment."id" = roots."id"
  AND comment."parentId" IS NOT NULL;

CREATE INDEX "PostComment_threadRootId_idx" ON "PostComment"("threadRootId");

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_threadRootId_fkey"
FOREIGN KEY ("threadRootId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
