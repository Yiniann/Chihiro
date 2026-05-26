ALTER TABLE "PostComment"
ALTER COLUMN "postId" DROP NOT NULL;

ALTER TABLE "PostComment"
ADD COLUMN "standalonePageId" INTEGER;

CREATE INDEX "PostComment_standalonePageId_status_createdAt_idx"
ON "PostComment"("standalonePageId", "status", "createdAt");

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_standalonePageId_fkey"
FOREIGN KEY ("standalonePageId") REFERENCES "StandalonePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
