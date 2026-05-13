ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "username" TEXT,
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

WITH ranked_admins AS (
  SELECT
    "id",
    "username",
    "passwordHash",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS "rank"
  FROM "AdminUser"
)
INSERT INTO "users" ("id", "username", "passwordHash", "name", "role")
SELECT
  "id",
  "username",
  "passwordHash",
  "username",
  CASE WHEN "rank" = 1 THEN 'OWNER'::"UserRole" ELSE 'ADMIN'::"UserRole" END
FROM ranked_admins
WHERE NOT EXISTS (
  SELECT 1
  FROM "users"
  WHERE "users"."id" = ranked_admins."id"
    OR "users"."username" = ranked_admins."username"
);

WITH ranked_admins AS (
  SELECT
    "id",
    "username",
    "passwordHash",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS "rank"
  FROM "AdminUser"
)
UPDATE "users"
SET
  "passwordHash" = COALESCE("users"."passwordHash", ranked_admins."passwordHash"),
  "role" = CASE
    WHEN ranked_admins."rank" = 1 THEN 'OWNER'::"UserRole"
    WHEN "users"."role" = 'USER' THEN 'ADMIN'::"UserRole"
    ELSE "users"."role"
  END
FROM ranked_admins
WHERE "users"."id" = ranked_admins."id"
  OR "users"."username" = ranked_admins."username";
