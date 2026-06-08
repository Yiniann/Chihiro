CREATE TYPE "MailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TYPE "MailJobKind" AS ENUM ('POST_PUBLISHED', 'UPDATE_PUBLISHED');

CREATE TYPE "MailJobContentType" AS ENUM ('POST', 'UPDATE');

CREATE TABLE "MailJob" (
  "id" TEXT NOT NULL,
  "kind" "MailJobKind" NOT NULL,
  "status" "MailJobStatus" NOT NULL DEFAULT 'PENDING',
  "contentType" "MailJobContentType" NOT NULL,
  "contentId" INTEGER NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MailJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailJob_dedupeKey_key" ON "MailJob"("dedupeKey");
CREATE INDEX "MailJob_status_scheduledAt_createdAt_idx" ON "MailJob"("status", "scheduledAt", "createdAt");
CREATE INDEX "MailJob_contentType_contentId_status_idx" ON "MailJob"("contentType", "contentId", "status");
CREATE INDEX "MailJob_recipientEmail_status_idx" ON "MailJob"("recipientEmail", "status");
