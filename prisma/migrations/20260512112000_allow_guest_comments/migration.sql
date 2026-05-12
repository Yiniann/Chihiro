ALTER TABLE "PostComment"
ADD COLUMN "authorName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "PostComment"
DROP CONSTRAINT "PostComment_userId_fkey";

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
