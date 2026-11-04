-- Leave types can be restricted to a gender. NULL means all genders.
--
-- Safe to run repeatedly.

BEGIN;

ALTER TABLE leave_type
    ADD COLUMN IF NOT EXISTS eligible_gender text;

ALTER TABLE leave_type
    DROP CONSTRAINT IF EXISTS leave_type_eligible_gender_check;

ALTER TABLE leave_type
    ADD CONSTRAINT leave_type_eligible_gender_check
    CHECK (eligible_gender IS NULL OR eligible_gender IN ('male', 'female', 'other'));

COMMIT;
