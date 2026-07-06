-- Add user_role enum and convert role column from text to user_role

CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');

-- We need to drop the default before changing type, then re-add it
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

-- Change the type with a USING clause to cast existing text to the enum
ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role" USING "role"::"public"."user_role";

-- Re-add the default as the enum type
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";
