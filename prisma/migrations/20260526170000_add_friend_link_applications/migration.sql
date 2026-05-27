CREATE TYPE "FriendLinkApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "FriendLinkApplication" (
    "id" SERIAL NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "rssUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "message" TEXT,
    "status" "FriendLinkApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "friendLinkId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendLinkApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FriendLinkApplication_status_createdAt_idx"
ON "FriendLinkApplication"("status", "createdAt");

CREATE INDEX "FriendLinkApplication_friendLinkId_idx"
ON "FriendLinkApplication"("friendLinkId");

ALTER TABLE "FriendLinkApplication"
ADD CONSTRAINT "FriendLinkApplication_friendLinkId_fkey"
FOREIGN KEY ("friendLinkId") REFERENCES "FriendLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
