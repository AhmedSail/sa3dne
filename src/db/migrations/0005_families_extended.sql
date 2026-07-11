DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gaza_governorate') THEN
        CREATE TYPE "public"."gaza_governorate" AS ENUM('north_gaza', 'gaza_city', 'middle_area', 'khan_yunis', 'rafah');
    END IF;
END $$;

ALTER TABLE "camp" DROP COLUMN IF EXISTS "location_text";

ALTER TABLE "camp" ADD COLUMN "location" "public"."gaza_governorate" DEFAULT 'gaza_city' NOT NULL;

ALTER TABLE "family" ADD COLUMN "occupation" text;

CREATE TABLE IF NOT EXISTS "family_member" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL REFERENCES "public"."family"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"education_level" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
