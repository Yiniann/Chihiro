ALTER TABLE "PostComment"
ADD COLUMN "parentId" TEXT;

CREATE INDEX "PostComment_parentId_idx" ON "PostComment"("parentId");

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
