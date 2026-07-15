CREATE TABLE IF NOT EXISTS "aid_contribution" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL REFERENCES "public"."aid_provider"("id") ON DELETE cascade,
	"status" "public"."contribution_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"submitted_at" timestamp,
	"created_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "aid_contribution_line" (
	"id" text PRIMARY KEY NOT NULL,
	"contribution_id" text NOT NULL REFERENCES "public"."aid_contribution"("id") ON DELETE cascade,
	"camp_id" text NOT NULL REFERENCES "public"."camp"("id") ON DELETE restrict,
	"aid_type_id" text NOT NULL REFERENCES "public"."aid_type"("id") ON DELETE restrict,
	"planned_quantity" integer NOT NULL,
	"unit" text NOT NULL,
	"planned_delivery_date" timestamp,
	"status" "public"."contribution_line_status" DEFAULT 'pending' NOT NULL,
	"actual_received_quantity" integer,
	"actual_receipt_date" timestamp,
	"confirmation_notes" text,
	"rejection_reason" text,
	"confirmed_by_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "aid_contribution_provider_idx" ON "aid_contribution" ("provider_id");
CREATE INDEX IF NOT EXISTS "aid_contribution_line_contribution_idx" ON "aid_contribution_line" ("contribution_id");
CREATE INDEX IF NOT EXISTS "aid_contribution_line_camp_idx" ON "aid_contribution_line" ("camp_id");
CREATE INDEX IF NOT EXISTS "aid_contribution_line_aid_type_idx" ON "aid_contribution_line" ("aid_type_id");
