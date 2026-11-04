import { expect, test } from "@playwright/test";
import {
  login,
  nextWeekdayIso,
  nextWeekend,
  openLeaveDetails,
  pickDate,
  queryDb,
  selectLeaveType,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test("a pending request can be approved after its start date has passed", async ({
  page,
}) => {
  await login(page, "manager@e2e.test");
  await page.goto("/leave");

  await openLeaveDetails(page, "Late Employee");
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await expect(page.getByText("Leave request approved")).toBeVisible();

  const [request] = await queryDb<{ status: string }>(
    `SELECT lr.status
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'LATE-1000'
     ORDER BY lr.created_at DESC
     LIMIT 1`
  );

  expect(request.status).toBe("approved");
});

test("approved leave that has already started cannot be cancelled", async ({
  page,
}) => {
  await login(page, "admin@e2e.test");
  await page.goto("/leave");

  await openLeaveDetails(page, "Past Employee");

  await expect(
    page.getByRole("button", { name: "Cancel request" })
  ).toHaveCount(0);

  const [request] = await queryDb<{ status: string }>(
    `SELECT lr.status
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'PAST-1000'
     ORDER BY lr.created_at DESC
     LIMIT 1`
  );

  expect(request.status).toBe("approved");
});

test("half-day leave is calculated as 0.5 working days", async ({ page }) => {
  const date = nextWeekdayIso(1);

  await login(page, "half@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();

  await selectLeaveType(page, "Vacation");
  await pickDate(page, date, "Start date");
  await pickDate(page, date, "End date");

  await page.getByRole("checkbox", { name: /Half day/ }).check();
  await expect(page.getByLabel("Days")).toHaveValue("0.5");

  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText("Leave request submitted")).toBeVisible();

  const [request] = await queryDb<{ days: number; status: string }>(
    `SELECT lr.days::float8 AS days, lr.status
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'HALF-1000'
     ORDER BY lr.created_at DESC
     LIMIT 1`
  );

  expect(request.days).toBe(0.5);
  expect(request.status).toBe("pending");
});

test("weekend-only leave is rejected", async ({ page }) => {
  const { saturday, sunday } = nextWeekend();

  await login(page, "weekend@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();

  await selectLeaveType(page, "Vacation");
  await pickDate(page, saturday, "Start date");
  await pickDate(page, sunday, "End date");

  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(
    page.getByText("Select at least one working day (Mon-Fri).")
  ).toBeVisible();

  const rows = await queryDb<{ count: number }>(
    `SELECT count(*)::int AS count
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'WEEK-1000'`
  );

  expect(rows[0].count).toBe(0);
});

test("a rejection note is saved and shown on the request", async ({ page }) => {
  await login(page, "manager@e2e.test");
  await page.goto("/leave");

  await openLeaveDetails(page, "Reject Employee");
  await page.getByLabel("Note (optional)").fill("Project deadline");
  await page.getByRole("button", { name: "Reject", exact: true }).click();

  await expect(page.getByText("Leave request rejected")).toBeVisible();

  const [request] = await queryDb<{ status: string; remark: string | null }>(
    `SELECT lr.status, lr.remark
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'REJ-1000'
     ORDER BY lr.created_at DESC
     LIMIT 1`
  );

  expect(request.status).toBe("rejected");
  expect(request.remark).toBe("Project deadline");
});

test("offboarding cancels future approved leave and unassigns reports", async ({
  page,
}) => {
  await login(page, "hr@e2e.test");
  await page.goto("/employees");

  const row = page.getByRole("row", { name: /Offboard Manager/ });
  await row.getByRole("button", { name: "Employee actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete employee" }).click();

  await expect(page.getByText("Employee deleted")).toBeVisible();

  const [manager] = await queryDb<{
    deleted: boolean;
    is_active: boolean;
  }>(
    `SELECT e.deleted_at IS NOT NULL AS deleted, u.is_active
     FROM employee e
     JOIN "user" u ON u.id = e.user_id
     WHERE e.employee_no = 'OFF-MGR-1000'`
  );

  expect(manager.deleted).toBe(true);
  expect(manager.is_active).toBe(false);

  const [report] = await queryDb<{ manager_id: string | null }>(
    `SELECT manager_id::text AS manager_id
     FROM employee
     WHERE employee_no = 'OFF-REP-1000'`
  );

  expect(report.manager_id).toBeNull();

  const [leave] = await queryDb<{ status: string }>(
    `SELECT lr.status
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     WHERE e.employee_no = 'OFF-MGR-1000'
       AND lr.reason = 'Future approved fixture'`
  );

  expect(leave.status).toBe("cancelled");

  const [balance] = await queryDb<{ used: number }>(
    `SELECT lb.used::float8 AS used
     FROM leave_balance lb
     JOIN employee e ON e.id = lb.employee_id
     JOIN leave_type lt ON lt.id = lb.leave_type_id
     WHERE e.employee_no = 'OFF-MGR-1000'
       AND lt.name = 'Vacation'
       AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE + 20)::int`
  );

  expect(balance.used).toBe(0);
});

test("offboarding cannot disable the last active admin", async ({ page }) => {
  await login(page, "hr@e2e.test");
  await page.goto("/employees");

  const row = page.getByRole("row", { name: /Admin Employee/ });
  await row.getByRole("button", { name: "Employee actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete employee" }).click();

  await expect(page.getByText(/last active admin/i)).toBeVisible();

  const [admin] = await queryDb<{
    deleted: boolean;
    is_active: boolean;
  }>(
    `SELECT e.deleted_at IS NOT NULL AS deleted, u.is_active
     FROM employee e
     JOIN "user" u ON u.id = e.user_id
     WHERE e.employee_no = 'ADM-1000'`
  );

  expect(admin.deleted).toBe(false);
  expect(admin.is_active).toBe(true);
});

test("managers do not receive hidden employee PII", async ({ page }) => {
  await login(page, "manager@e2e.test");
  await page.goto("/employees");
  await expect(page.getByRole("row", { name: /PII Employee/ })).toBeVisible();

  const html = await page.content();

  expect(html).toContain("PII Employee");
  expect(html).not.toContain("09170000000");
  expect(html).not.toContain("42 Secret Lane");
});
