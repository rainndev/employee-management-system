-- Rejects a second pending/approved leave request that overlaps an existing
-- one for the same employee. Rejected/cancelled requests free their dates.
--
-- Safe to run repeatedly (IF NOT EXISTS / pg_constraint check).
--
-- Run in pgAdmin's Query Tool on the EMS database, or:
--   psql "$DATABASE_URL" -f db/migrations/002_prevent_overlapping_leave.sql

BEGIN;

-- btree_gist lets a uuid column take part in a gist exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
DECLARE
  conflicts integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leave_request_no_overlap'
  ) THEN
    RETURN;
  END IF;

  -- Add the constraint only when the existing data already satisfies it, so
  -- failures name the real problem instead of a bare exclusion violation.
  SELECT count(*)
  INTO conflicts
  FROM leave_request a
  JOIN leave_request b
    ON a.id < b.id
   AND a.employee_id = b.employee_id
   AND a.status IN ('pending', 'approved')
   AND b.status IN ('pending', 'approved')
   AND daterange(a.start_date, a.end_date, '[]')
       && daterange(b.start_date, b.end_date, '[]');

  IF conflicts > 0 THEN
    RAISE EXCEPTION
      'Cannot add leave_request_no_overlap: % overlapping pending/approved request pair(s) exist. Resolve them, then rerun.',
      conflicts;
  END IF;

  ALTER TABLE leave_request
    ADD CONSTRAINT leave_request_no_overlap
    EXCLUDE USING gist (
      employee_id WITH =,
      daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (status IN ('pending', 'approved'));
END $$;

COMMIT;
