-- Allow the homepage hero intro paragraph to be edited from the admin settings.

ALTER TABLE "SiteSettings"
ADD COLUMN IF NOT EXISTS "heroIntro" TEXT;
