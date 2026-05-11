ALTER TABLE "Post"
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PostView" (
  "id" TEXT NOT NULL,
  "postId" INTEGER NOT NULL,
  "visitorId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostLike" (
  "id" TEXT NOT NULL,
  "postId" INTEGER NOT NULL,
  "visitorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostView_postId_visitorId_bucket_key" ON "PostView"("postId", "visitorId", "bucket");
CREATE INDEX "PostView_postId_idx" ON "PostView"("postId");
CREATE INDEX "PostView_visitorId_idx" ON "PostView"("visitorId");

CREATE UNIQUE INDEX "PostLike_postId_visitorId_key" ON "PostLike"("postId", "visitorId");
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");
CREATE INDEX "PostLike_visitorId_idx" ON "PostLike"("visitorId");

ALTER TABLE "PostView"
ADD CONSTRAINT "PostView_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostLike"
ADD CONSTRAINT "PostLike_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
