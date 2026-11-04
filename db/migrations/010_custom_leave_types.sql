-- Admin-managed custom leave types with soft deletion.
--
-- Safe to run repeatedly.

BEGIN;

ALTER TABLE leave_type
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE leave_type DROP CONSTRAINT IF EXISTS leave_type_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS leave_type_name_active_key
    ON leave_type (lower(name)) WHERE deleted_at IS NULL;

COMMIT;
