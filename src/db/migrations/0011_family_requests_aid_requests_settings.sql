-- Additive migration: tables that exist in `src/db/schema` but were never
-- generated into a migration file — family update requests, camp aid requests
-- (with provider responses), and the public contact settings singleton.
--
-- Everything is guarded with IF NOT EXISTS so it is safe to re-apply.

DO $$ BEGIN
	CREATE TYPE "public"."family_request_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	CREATE TYPE "public"."family_request_type" AS ENUM('add_member', 'remove_member', 'update_family_info', 'update_member');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "family_update_request" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL REFERENCES "public"."family"("id") ON DELETE cascade,
	"requested_by_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"type" "public"."family_request_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "public"."family_request_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "family_update_request_family_idx" ON "family_update_request" ("family_id");
CREATE INDEX IF NOT EXISTS "family_update_request_status_idx" ON "family_update_request" ("status");

CREATE TABLE IF NOT EXISTS "aid_request" (
	"id" text PRIMARY KEY NOT NULL,
	"camp_id" text NOT NULL REFERENCES "public"."camp"("id") ON DELETE cascade,
	"aid_type_id" text NOT NULL REFERENCES "public"."aid_type"("id") ON DELETE restrict,
	"requested_quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"urgency_level" text DEFAULT 'medium' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'open' NOT NULL,
	"requested_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "aid_request_camp_idx" ON "aid_request" ("camp_id");
CREATE INDEX IF NOT EXISTS "aid_request_status_idx" ON "aid_request" ("status");

CREATE TABLE IF NOT EXISTS "aid_request_response" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL REFERENCES "public"."aid_request"("id") ON DELETE cascade,
	"provider_id" text NOT NULL REFERENCES "public"."aid_provider"("id") ON DELETE cascade,
	"committed_quantity" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'committed' NOT NULL,
	"responded_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "aid_request_response_request_idx" ON "aid_request_response" ("request_id");
CREATE INDEX IF NOT EXISTS "aid_request_response_provider_idx" ON "aid_request_response" ("provider_id");

CREATE TABLE IF NOT EXISTS "contact_settings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"whatsapp" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"facebook" varchar(255),
	"twitter" varchar(255),
	"instagram" varchar(255),
	"linkedin" varchar(255),
	"address" text,
	"updated_at" timestamp DEFAULT now()
);
