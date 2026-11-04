-- The past-date guard must block new requests, not approval of a request whose
-- start date has since passed. Keep the trigger on INSERT and on changes to
-- start_date; do not fire it when only the status changes.
--
-- Safe to run repeatedly.

BEGIN;

DROP TRIGGER IF EXISTS leave_request_no_past_dates ON leave_request;
CREATE TRIGGER leave_request_no_past_dates
BEFORE INSERT OR UPDATE OF start_date ON leave_request
FOR EACH ROW EXECUTE FUNCTION prevent_past_leave_request();

COMMIT;
