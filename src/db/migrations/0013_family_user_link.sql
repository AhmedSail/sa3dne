-- One-to-one link between a household record and the account of its head.
--
-- Until now the two were joined by convention — a beneficiary signed in as
-- `<nationalId>@sa3dne.local` and the family was looked up by matching that
-- string against `national_id`. That broke as soon as a head of household used
-- a real e-mail address, and it could never be enforced by the database.
--
-- The column is nullable so that a household keeps its population statistics
-- when the account behind it is deleted, and UNIQUE so that no two families can
-- claim the same account: together that is a 0..1-to-1 relationship.
--
-- Idempotent, so it is safe to re-apply.

ALTER TABLE "family" ADD COLUMN IF NOT EXISTS "user_id" text;

DO $$ BEGIN
	ALTER TABLE "family"
		ADD CONSTRAINT "family_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- UNIQUE rather than a plain index: PostgreSQL allows many NULLs in a unique
-- column, so unlinked families stay legal while linked ones stay exclusive.
CREATE UNIQUE INDEX IF NOT EXISTS "family_user_id_unique_idx"
	ON "family" ("user_id");
