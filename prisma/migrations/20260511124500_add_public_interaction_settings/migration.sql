CREATE TABLE "PublicInteractionSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "commentsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "loginRequiredToComment" BOOLEAN NOT NULL DEFAULT true,
  "commentModeration" BOOLEAN NOT NULL DEFAULT true,
  "githubLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
  "googleLoginEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PublicInteractionSettings_pkey" PRIMARY KEY ("id")
);
