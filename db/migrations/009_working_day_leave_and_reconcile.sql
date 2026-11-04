-- Leave is counted in working days (Monday-Friday), not calendar days.
-- Historical rows are recalculated and balances are reconciled so already
-- approved leave is not invalidated.
--
-- Safe to run repeatedly.

BEGIN;

-- Recalculate existing day counts. Preserve an explicit single-day half-day
-- request and give historical weekend-only requests a minimal half-day value
-- instead of zero (the application rejects new weekend-only requests).
UPDATE leave_request lr
SET days = CASE
    WHEN lr.start_date = lr.end_date AND lr.days = 0.5 THEN 0.5
    WHEN w.working_days = 0 THEN 0.5
    ELSE w.working_days
  END
FROM (
  SELECT lr2.id,
         count(*) FILTER (WHERE EXTRACT(ISODOW FROM d) < 6) AS working_days
  FROM leave_request lr2
  CROSS JOIN LATERAL generate_series(
    lr2.start_date,
    lr2.end_date,
    interval '1 day'
  ) AS d
  GROUP BY lr2.id
) w
WHERE lr.id = w.id
  AND lr.days <> CASE
    WHEN lr.start_date = lr.end_date AND lr.days = 0.5 THEN 0.5
    WHEN w.working_days = 0 THEN 0.5
    ELSE w.working_days
  END;

-- Used days always derive from approved requests.
UPDATE leave_balance lb
SET used = COALESCE((
  SELECT sum(lr.days)
  FROM leave_request lr
  WHERE lr.employee_id = lb.employee_id
    AND lr.leave_type_id = lb.leave_type_id
    AND lr.status = 'approved'
    AND EXTRACT(YEAR FROM lr.start_date)::int = lb.year
), 0);

-- Honour approved historical leave instead of leaving a negative balance.
UPDATE leave_balance
SET allocated = GREATEST(allocated, used);

COMMIT;
