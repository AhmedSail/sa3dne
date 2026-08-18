-- Removes every household record and every beneficiary account, so the data
-- can be regenerated with the one-to-one `family.user_id` link in place.
--
-- NOT a migration: it is never applied automatically and is not part of the
-- numbered sequence. Run it by hand, once, against the database you mean to
-- clear.
--
-- Every dependent row is handled by the foreign keys already declared on the
-- schema, so nothing has to be deleted by hand first:
--
--   family        -> family_member            ON DELETE CASCADE
--                 -> family_update_request    ON DELETE CASCADE
--
--   user          -> account                  ON DELETE CASCADE
--                 -> session                  ON DELETE CASCADE
--                 -> notification             ON DELETE CASCADE
--                 -> camp_assignment          ON DELETE CASCADE
--                 -> family_update_request    ON DELETE CASCADE  (requested_by_id)
--                 -> family.user_id           ON DELETE SET NULL
--                 -> audit_log.user_id        ON DELETE SET NULL
--                 -> complaints.reviewed_by_id, aid_contribution.created_by_id,
--                    aid_contribution_line.confirmed_by_id, aid_request.requested_by_id,
--                    aid_request_response.responded_by_id, aid_provider.linked_user_id
--                                              ON DELETE SET NULL
--
-- One transaction: either both deletions land or neither does, so the database
-- is never left with beneficiary accounts pointing at households that are gone.

BEGIN;

-- Households first. Deleting the accounts first would only null out
-- `family.user_id` on rows that are about to be removed anyway.
DELETE FROM "family";

DELETE FROM "user" WHERE "role" = 'beneficiary';

-- What is left. Every count must read 0.
SELECT
    (SELECT count(*) FROM "family")                              AS families,
    (SELECT count(*) FROM "family_member")                       AS family_members,
    (SELECT count(*) FROM "family_update_request")               AS update_requests,
    (SELECT count(*) FROM "user" WHERE "role" = 'beneficiary')   AS beneficiaries;

-- Review the counts above, then finish with:
COMMIT;
-- ...or abandon the whole thing with:
-- ROLLBACK;
