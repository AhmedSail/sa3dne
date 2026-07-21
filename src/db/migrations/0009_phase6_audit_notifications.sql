DO $$ BEGIN
	CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"old_value_json" jsonb,
	"new_value_json" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"link" text,
	"status" "public"."notification_status" DEFAULT 'unread' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);

CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" ("user_id");
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" ("action");
CREATE INDEX IF NOT EXISTS "audit_log_entity_idx" ON "audit_log" ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" ("created_at");

CREATE INDEX IF NOT EXISTS "notification_user_idx" ON "notification" ("user_id");
CREATE INDEX IF NOT EXISTS "notification_user_status_idx" ON "notification" ("user_id","status");
CREATE INDEX IF NOT EXISTS "notification_created_at_idx" ON "notification" ("created_at");
