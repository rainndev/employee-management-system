-- Integrity, authentication, and soft-delete hardening.
--
-- Safe to run repeatedly. Run in pgAdmin's Query Tool on the EMS database, or:
--   psql "$DATABASE_URL" -f db/migrations/004_integrity_auth_and_soft_delete.sql

BEGIN;

-- ----------------------------------------------------------------------------
-- Case-insensitive email identity + session revocation
-- ----------------------------------------------------------------------------
UPDATE "user" SET email = lower(email) WHERE email <> lower(email);

ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_email_lower_key
    ON "user" (lower(email));

ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- Soft-delete friendly employee identity
-- ----------------------------------------------------------------------------
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_no_key;
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS employee_no_active_key
    ON employee (lower(employee_no)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employee_user_id_active_key
    ON employee (user_id) WHERE deleted_at IS NULL AND user_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Case-insensitive department/position names
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS department_name_active_key;
CREATE UNIQUE INDEX IF NOT EXISTS department_name_active_key
    ON department (lower(name)) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS position_title_active_key;
CREATE UNIQUE INDEX IF NOT EXISTS position_title_active_key
    ON position (lower(title)) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Leave days cannot exceed the selected range or be below half a day
-- ----------------------------------------------------------------------------
UPDATE leave_request
SET days = (end_date - start_date + 1)
WHERE days < 0.5 OR days > (end_date - start_date + 1);

ALTER TABLE leave_request DROP CONSTRAINT IF EXISTS leave_request_days_check;
ALTER TABLE leave_request
    ADD CONSTRAINT leave_request_days_check
    CHECK (days >= 0.5 AND days <= (end_date - start_date + 1));

-- ----------------------------------------------------------------------------
-- Query-shape indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS leave_request_status_start_idx
    ON leave_request (status, start_date);
CREATE INDEX IF NOT EXISTS leave_request_employee_status_start_idx
    ON leave_request (employee_id, status, start_date);
CREATE INDEX IF NOT EXISTS user_created_at_idx
    ON "user" (created_at);
CREATE INDEX IF NOT EXISTS employee_status_active_idx
    ON employee (status) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Audit trail for administrative and record-changing actions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES "user" (id) ON DELETE SET NULL,
    action        text NOT NULL,
    entity        text NOT NULL,
    entity_id     text,
    details       jsonb,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx
    ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
    ON audit_log (entity, entity_id);

COMMIT;
