ALTER TABLE "SiteSettings"
ADD COLUMN "siteLiveVisitorsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "postReadingPresenceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "standalonePageReadingPresenceEnabled" BOOLEAN NOT NULL DEFAULT true;
