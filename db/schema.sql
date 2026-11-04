-- ============================================================================
-- Employee Management System - PostgreSQL schema
-- Generated from assets/ERD.png
--
-- How to run in pgAdmin 4:
--   1. Connect to your database, right-click the DB -> Query Tool
--   2. Paste this whole file, press F5 (Execute)
--
-- Existing database? Run every file in db/migrations/ in order (or
-- `pnpm db:migrate`), because CREATE TABLE IF NOT EXISTS does not add new
-- columns or replace constraints on existing tables.
--
-- Requires PostgreSQL 13+ (gen_random_uuid() is built into core).
-- Note: "user" is a reserved keyword, so it must always be double-quoted.
-- ============================================================================

BEGIN;

-- Needed for the leave_request_no_overlap exclusion constraint (uuid = in gist).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- DROP (optional, reverse dependency order). Uncomment to reset the database.
-- ----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS leave_balance CASCADE;
-- DROP TABLE IF EXISTS leave_request CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS leave_type CASCADE;
-- DROP TABLE IF EXISTS employee CASCADE;
-- DROP TABLE IF EXISTS "user" CASCADE;
-- DROP TABLE IF EXISTS position CASCADE;
-- DROP TABLE IF EXISTS department CASCADE;
-- DROP FUNCTION IF EXISTS set_updated_at();

-- ----------------------------------------------------------------------------
-- DEPARTMENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS department (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- Name must be unique among non-deleted rows (soft delete friendly), ignoring
-- case so "Sales" and "sales" cannot both exist.
CREATE UNIQUE INDEX IF NOT EXISTS department_name_active_key
    ON department (lower(name)) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- POSITION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS position (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS position_title_active_key
    ON position (lower(title)) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- "user"
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text NOT NULL,
    password_hash text NOT NULL,
    role            text NOT NULL DEFAULT 'employee',
    is_active       boolean NOT NULL DEFAULT true,
    -- Bumped when a password is changed/reset so existing JWTs are rejected.
    session_version integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_role_check
        CHECK (role IN ('admin', 'hr', 'manager', 'employee'))
);

-- Emails are stored lower-cased by the app; enforce that at the database too.
CREATE UNIQUE INDEX IF NOT EXISTS user_email_lower_key
    ON "user" (lower(email));

-- ----------------------------------------------------------------------------
-- LEAVE_TYPE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_type (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    default_days integer NOT NULL DEFAULT 0,
    is_paid      boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT leave_type_name_key UNIQUE (name),
    CONSTRAINT leave_type_default_days_check CHECK (default_days >= 0)
);

-- ----------------------------------------------------------------------------
-- EMPLOYEE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid REFERENCES "user" (id) ON DELETE SET NULL,
    employee_no   text NOT NULL,
    first_name    text NOT NULL,
    last_name     text NOT NULL,
    birthdate     date,
    gender        text,
    phone         text,
    address       text,
    hire_date     date,
    status        text NOT NULL DEFAULT 'active',
    department_id uuid REFERENCES department (id) ON DELETE SET NULL,
    position_id   uuid REFERENCES position (id) ON DELETE SET NULL,
    manager_id    uuid REFERENCES employee (id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT employee_gender_check
        CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
    CONSTRAINT employee_status_check
        CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave'))
);

-- Uniqueness applies only to active (non-deleted) employees, so soft-deleted
-- employee numbers and linked accounts can be reused.
CREATE UNIQUE INDEX IF NOT EXISTS employee_no_active_key
    ON employee (lower(employee_no)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS employee_user_id_active_key
    ON employee (user_id) WHERE deleted_at IS NULL AND user_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- ATTENDANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES employee (id) ON DELETE CASCADE,
    work_date   date NOT NULL,
    time_in     timestamptz,
    time_out    timestamptz,
    total_hours numeric(5, 2),
    status      text NOT NULL DEFAULT 'present',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attendance_employee_work_date_key UNIQUE (employee_id, work_date),
    CONSTRAINT attendance_status_check
        CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday')),
    CONSTRAINT attendance_time_check
        CHECK (time_out IS NULL OR time_in IS NULL OR time_out >= time_in)
);

-- ----------------------------------------------------------------------------
-- LEAVE_REQUEST
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_request (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   uuid NOT NULL REFERENCES employee (id) ON DELETE CASCADE,
    leave_type_id uuid NOT NULL REFERENCES leave_type (id) ON DELETE RESTRICT,
    start_date    date NOT NULL,
    end_date      date NOT NULL,
    days          numeric(5, 2) NOT NULL,
    reason        text,
    status        text NOT NULL DEFAULT 'pending',
    approver_id   uuid REFERENCES employee (id) ON DELETE SET NULL,
    remark        text,
    decided_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT leave_request_status_check
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    CONSTRAINT leave_request_dates_check CHECK (end_date >= start_date),
    CONSTRAINT leave_request_days_check
        CHECK (days >= 0.5 AND days <= (end_date - start_date + 1)),
    -- One employee cannot hold two pending/approved requests over the same day.
    CONSTRAINT leave_request_no_overlap
        EXCLUDE USING gist (
            employee_id WITH =,
            daterange(start_date, end_date, '[]') WITH &&
        ) WHERE (status IN ('pending', 'approved'))
);

-- ----------------------------------------------------------------------------
-- LEAVE_BALANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_balance (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id   uuid NOT NULL REFERENCES employee (id) ON DELETE CASCADE,
    leave_type_id uuid NOT NULL REFERENCES leave_type (id) ON DELETE RESTRICT,
    year          integer NOT NULL,
    allocated     numeric(5, 2) NOT NULL DEFAULT 0,
    used          numeric(5, 2) NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT leave_balance_employee_type_year_key
        UNIQUE (employee_id, leave_type_id, year),
    CONSTRAINT leave_balance_allocated_check CHECK (allocated >= 0),
    CONSTRAINT leave_balance_used_check CHECK (used >= 0)
);

-- ----------------------------------------------------------------------------
-- AUDIT_LOG
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

-- ----------------------------------------------------------------------------
-- Indexes on foreign keys (Postgres does not create these automatically)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS employee_department_id_idx ON employee (department_id);
CREATE INDEX IF NOT EXISTS employee_position_id_idx   ON employee (position_id);
CREATE INDEX IF NOT EXISTS employee_manager_id_idx    ON employee (manager_id);
CREATE INDEX IF NOT EXISTS attendance_employee_id_idx ON attendance (employee_id);
CREATE INDEX IF NOT EXISTS leave_request_employee_id_idx   ON leave_request (employee_id);
CREATE INDEX IF NOT EXISTS leave_request_approver_id_idx   ON leave_request (approver_id);
CREATE INDEX IF NOT EXISTS leave_request_leave_type_id_idx ON leave_request (leave_type_id);
CREATE INDEX IF NOT EXISTS leave_balance_employee_id_idx   ON leave_balance (employee_id);

-- Query-shape indexes used by the dashboard/admin/leave lists.
CREATE INDEX IF NOT EXISTS leave_request_status_start_idx
    ON leave_request (status, start_date);
CREATE INDEX IF NOT EXISTS leave_request_employee_status_start_idx
    ON leave_request (employee_id, status, start_date);
CREATE INDEX IF NOT EXISTS user_created_at_idx
    ON "user" (created_at);
CREATE INDEX IF NOT EXISTS employee_status_active_idx
    ON employee (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx
    ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
    ON audit_log (entity, entity_id);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON department;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON department
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON position;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON position
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "user";
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON leave_type;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_type
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON employee;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON employee
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON attendance;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON leave_request;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_request
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON leave_balance;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_balance
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
