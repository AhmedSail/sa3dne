CREATE TABLE IF NOT EXISTS "camp" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location_text" text,
	"capacity" integer NOT NULL,
	"operational_status" "public"."camp_status" DEFAULT 'active' NOT NULL,
	"need_level" "public"."need_level" DEFAULT 'low' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "camp_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"camp_id" text NOT NULL REFERENCES "public"."camp"("id") ON DELETE cascade,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "family" (
	"id" text PRIMARY KEY NOT NULL,
	"camp_id" text NOT NULL REFERENCES "public"."camp"("id") ON DELETE cascade,
	"head_name" text NOT NULL,
	"national_id" text NOT NULL,
	"phone" text,
	"member_count" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"inactive_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "aid_type" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"default_unit" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "aid_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "public"."provider_type" NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"notes" text,
	"linked_user_id" text REFERENCES "public"."user"("id") ON DELETE set null,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
