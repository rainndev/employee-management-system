-- New leave requests cannot start before the current business day.
--
-- Approved historical rows are intentionally left alone; only pending requests
-- whose start date is already in the past are cancelled here.
--
-- Safe to run repeatedly.

BEGIN;

WITH cancelled AS (
  UPDATE leave_request
  SET status = 'cancelled',
      decided_at = now(),
      remark = 'Cancelled automatically: the start date is in the past.'
  WHERE status = 'pending'
    AND start_date < CURRENT_DATE
  RETURNING id
)
INSERT INTO audit_log (actor_user_id, action, entity, entity_id, details)
SELECT NULL,
       'leave.cancel',
       'leave_request',
       id::text,
       '{"reason":"past start date migration"}'::jsonb
FROM cancelled;

CREATE OR REPLACE FUNCTION prevent_past_leave_request()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('pending', 'approved')
     AND NEW.start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'leave request start date cannot be in the past'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_request_no_past_dates ON leave_request;
CREATE TRIGGER leave_request_no_past_dates
BEFORE INSERT OR UPDATE OF start_date, status ON leave_request
FOR EACH ROW EXECUTE FUNCTION prevent_past_leave_request();

COMMIT;
