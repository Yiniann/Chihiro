ALTER TABLE "PublicInteractionSettings"
ADD COLUMN "subscriptionConfirmSubject" TEXT,
ADD COLUMN "subscriptionConfirmHeadline" TEXT,
ADD COLUMN "subscriptionConfirmBody" TEXT,
ADD COLUMN "subscriptionConfirmCtaLabel" TEXT,
ADD COLUMN "postNotificationSubject" TEXT,
ADD COLUMN "postNotificationHeadline" TEXT,
ADD COLUMN "postNotificationBody" TEXT,
ADD COLUMN "postNotificationCtaLabel" TEXT,
ADD COLUMN "updateNotificationSubject" TEXT,
ADD COLUMN "updateNotificationHeadline" TEXT,
ADD COLUMN "updateNotificationBody" TEXT,
ADD COLUMN "updateNotificationCtaLabel" TEXT;
