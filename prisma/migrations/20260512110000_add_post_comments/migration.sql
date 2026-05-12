CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'SPAM');

CREATE TABLE "PostComment" (
  "id" TEXT NOT NULL,
  "postId" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostComment_postId_status_createdAt_idx" ON "PostComment"("postId", "status", "createdAt");
CREATE INDEX "PostComment_userId_idx" ON "PostComment"("userId");

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
