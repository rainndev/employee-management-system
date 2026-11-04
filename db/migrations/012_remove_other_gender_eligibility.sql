-- "Other only" is equivalent to all-gender eligibility, so it is no longer an
-- option. Convert any existing value to NULL (all genders).
--
-- Safe to run repeatedly.

BEGIN;

UPDATE leave_type
SET eligible_gender = NULL
WHERE eligible_gender = 'other';

ALTER TABLE leave_type
    DROP CONSTRAINT IF EXISTS leave_type_eligible_gender_check;

ALTER TABLE leave_type
    ADD CONSTRAINT leave_type_eligible_gender_check
    CHECK (eligible_gender IS NULL OR eligible_gender IN ('male', 'female'));

COMMIT;
