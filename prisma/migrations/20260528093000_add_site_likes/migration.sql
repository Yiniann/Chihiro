CREATE TABLE "SiteLike" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiteLike_visitorId_key" ON "SiteLike"("visitorId");
CREATE INDEX "SiteLike_visitorId_idx" ON "SiteLike"("visitorId");
