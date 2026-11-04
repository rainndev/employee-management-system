import { differenceInCalendarDays, isValid } from "date-fns";

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);

  // Reject overflowing dates such as 2026-02-31 (which JS would roll into March).
  if (
    !isValid(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

// Inclusive calendar-day count between two ISO dates. Returns 0 for missing or
// invalid ranges so callers can treat it as "no days selected".
export function countLeaveDays(startDate: string, endDate: string): number {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  if (!start || !end || end < start) {
    return 0;
  }

  return differenceInCalendarDays(end, start) + 1;
}
