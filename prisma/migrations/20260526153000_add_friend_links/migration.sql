CREATE TABLE "FriendLink" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "location" TEXT,
    "feedUrl" TEXT,
    "email" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FriendLink_isVisible_sortOrder_updatedAt_idx"
ON "FriendLink"("isVisible", "sortOrder", "updatedAt");
