-- Additive migration: `user.camp_id`, the primary camp scope used by camp
-- managers and beneficiaries. Present in `src/db/schema/auth.ts` but never
-- generated into a migration file.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "camp_id" text;

DO $$ BEGIN
	ALTER TABLE "user"
		ADD CONSTRAINT "user_camp_id_camp_id_fk"
		FOREIGN KEY ("camp_id") REFERENCES "public"."camp"("id") ON DELETE set null;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
