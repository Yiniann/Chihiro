ALTER TABLE "Subscriber"
ADD COLUMN "subscribedToPosts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "subscribedToUpdates" BOOLEAN NOT NULL DEFAULT true;
