DO $$ BEGIN
	CREATE TYPE "public"."complaint_type" AS ENUM('complaint', 'suggestion', 'unmet_need');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	CREATE TYPE "public"."complaint_status" AS ENUM('pending', 'in_review', 'resolved', 'rejected');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "complaints" (
	"id" text PRIMARY KEY NOT NULL,
	"tracking_number" text NOT NULL UNIQUE,
	"camp_id" text NOT NULL REFERENCES "public"."camp"("id") ON DELETE cascade,
	"type" "public"."complaint_type" NOT NULL,
	"beneficiary_name" text NOT NULL,
	"phone" text,
	"details" text NOT NULL,
	"status" "public"."complaint_status" DEFAULT 'pending' NOT NULL,
	"resolution_notes" text,
	"rejection_reason" text,
	"reviewed_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "complaints_camp_idx" ON "complaints" ("camp_id");
CREATE INDEX IF NOT EXISTS "complaints_status_idx" ON "complaints" ("status");
