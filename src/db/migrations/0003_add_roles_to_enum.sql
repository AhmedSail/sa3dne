-- Add new values to user_role enum
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'camp_manager';
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'org_representative';
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'independent_initiator';
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'beneficiary';
