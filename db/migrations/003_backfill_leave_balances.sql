-- Gives every employee a per-type/year balance and rebuilds `used` from
-- approved requests so the app can enforce and display remaining allowance.
--
-- Safe to run repeatedly.
--
-- Run in pgAdmin's Query Tool on the EMS database, or:
--   psql "$DATABASE_URL" -f db/migrations/003_backfill_leave_balances.sql

BEGIN;

-- Current-year allocation from each leave type's default.
INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
SELECT e.id, lt.id, EXTRACT(YEAR FROM CURRENT_DATE)::int, lt.default_days
FROM employee e
CROSS JOIN leave_type lt
WHERE e.deleted_at IS NULL
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- Allocation for any earlier/future year that already has leave requests.
INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
SELECT DISTINCT
       lr.employee_id,
       lr.leave_type_id,
       EXTRACT(YEAR FROM lr.start_date)::int,
       lt.default_days
FROM leave_request lr
JOIN leave_type lt ON lt.id = lr.leave_type_id
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

-- `used` is the sum of approved days for that employee/type/year.
WITH approved AS (
  SELECT employee_id,
         leave_type_id,
         EXTRACT(YEAR FROM start_date)::int AS year,
         sum(days)::numeric(5, 2) AS used
  FROM leave_request
  WHERE status = 'approved'
  GROUP BY employee_id, leave_type_id, EXTRACT(YEAR FROM start_date)
)
UPDATE leave_balance lb
SET used = approved.used
FROM approved
WHERE lb.employee_id = approved.employee_id
  AND lb.leave_type_id = approved.leave_type_id
  AND lb.year = approved.year;

COMMIT;
