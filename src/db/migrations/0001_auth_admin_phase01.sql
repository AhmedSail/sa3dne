-- Phase 01 migration: Add Better Auth admin plugin fields to user table
-- Rename phone_number -> phone (as text), remove bio,
-- add role, banned, ban_reason, ban_expires columns,
-- drop old user_role and user_status enums

-- 1. Add new columns
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;

-- 2. Migrate existing phone_number data into phone (cast integer to text)
UPDATE "user" SET "phone" = "phone_number"::text WHERE "phone_number" IS NOT NULL;

-- 3. Drop old columns
ALTER TABLE "user" DROP COLUMN IF EXISTS "phone_number";
ALTER TABLE "user" DROP COLUMN IF EXISTS "bio";

-- 4. Drop old enums that are no longer used (they have no table references now)
DROP TYPE IF EXISTS "public"."user_role";
DROP TYPE IF EXISTS "public"."user_status";
