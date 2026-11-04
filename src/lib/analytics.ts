import "server-only";

import { pool } from "@/lib/db";
import { getMyEmployeeId } from "@/lib/leave";
import type { CurrentUser } from "@/lib/dal";

export type Stat = {
  label: string;
  value: number;
  hint: string;
};

const NO_EMPLOYEE_HINT = "Link your account to an employee";

function zeros(labels: string[]): Stat[] {
  return labels.map((label) => ({
    label,
    value: 0,
    hint: NO_EMPLOYEE_HINT,
  }));
}

async function getAdminStats(): Promise<Stat[]> {
  const { rows } = await pool.query<{
    employees: number;
    departments: number;
    users: number;
    pending_leave: number;
  }>(`
    SELECT
      (SELECT count(*) FROM employee WHERE deleted_at IS NULL)::int AS employees,
      (SELECT count(*) FROM department WHERE deleted_at IS NULL)::int AS departments,
      (SELECT count(*) FROM "user")::int AS users,
      (SELECT count(*) FROM leave_request WHERE status = 'pending')::int AS pending_leave
  `);

  const row = rows[0];

  return [
    { label: "Employees", value: row.employees, hint: "Active records" },
    { label: "Departments", value: row.departments, hint: "Active" },
    { label: "Users", value: row.users, hint: "All accounts" },
    {
      label: "Pending leave",
      value: row.pending_leave,
      hint: "Awaiting decision",
    },
  ];
}

async function getHrStats(): Promise<Stat[]> {
  const { rows } = await pool.query<{
    employees: number;
    positions: number;
    pending_leave: number;
    approved_leave: number;
  }>(`
    SELECT
      (SELECT count(*) FROM employee WHERE deleted_at IS NULL)::int AS employees,
      (SELECT count(*) FROM position WHERE deleted_at IS NULL)::int AS positions,
      (SELECT count(*) FROM leave_request WHERE status = 'pending')::int AS pending_leave,
      (SELECT count(*) FROM leave_request WHERE status = 'approved')::int AS approved_leave
  `);

  const row = rows[0];

  return [
    { label: "Employees", value: row.employees, hint: "Active records" },
    { label: "Positions", value: row.positions, hint: "Open roles defined" },
    {
      label: "Pending leave",
      value: row.pending_leave,
      hint: "Awaiting decision",
    },
    { label: "Approved leave", value: row.approved_leave, hint: "All time" },
  ];
}

async function getManagerStats(userId: string): Promise<Stat[]> {
  const employeeId = await getMyEmployeeId(userId);

  if (!employeeId) {
    return zeros([
      "Team members",
      "Pending approvals",
      "Approved leave",
      "Upcoming leave",
    ]);
  }

  const { rows } = await pool.query<{
    team: number;
    pending_leave: number;
    approved_leave: number;
    upcoming_leave: number;
  }>(
    `SELECT
       (SELECT count(*) FROM employee
        WHERE deleted_at IS NULL
          AND status IN ('active', 'on_leave')
          AND manager_id = $1)::int AS team,
       (SELECT count(*) FROM leave_request lr
        JOIN employee e ON e.id = lr.employee_id
        WHERE e.manager_id = $1 AND lr.status = 'pending')::int AS pending_leave,
       (SELECT count(*) FROM leave_request lr
        JOIN employee e ON e.id = lr.employee_id
        WHERE e.manager_id = $1 AND lr.status = 'approved')::int AS approved_leave,
       (SELECT count(*) FROM leave_request lr
        JOIN employee e ON e.id = lr.employee_id
        WHERE e.manager_id = $1 AND lr.status = 'approved'
          AND lr.start_date >= CURRENT_DATE)::int AS upcoming_leave`,
    [employeeId]
  );

  const row = rows[0];

  return [
    { label: "Team members", value: row.team, hint: "Report to you" },
    { label: "Pending approvals", value: row.pending_leave, hint: "Your team" },
    {
      label: "Approved leave",
      value: row.approved_leave,
      hint: "Your team, all time",
    },
    {
      label: "Upcoming leave",
      value: row.upcoming_leave,
      hint: "Starting today or later",
    },
  ];
}

async function getEmployeeStats(userId: string): Promise<Stat[]> {
  const employeeId = await getMyEmployeeId(userId);

  if (!employeeId) {
    return zeros(["My requests", "Pending", "Approved", "Days taken"]);
  }

  const { rows } = await pool.query<{
    total: number;
    pending: number;
    approved: number;
    days_taken: number;
  }>(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status = 'pending')::int AS pending,
       count(*) FILTER (WHERE status = 'approved')::int AS approved,
       coalesce(sum(days) FILTER (WHERE status = 'approved'), 0)::float8 AS days_taken
     FROM leave_request
     WHERE employee_id = $1`,
    [employeeId]
  );

  const row = rows[0];

  return [
    { label: "My requests", value: row.total, hint: "All time" },
    { label: "Pending", value: row.pending, hint: "Awaiting decision" },
    { label: "Approved", value: row.approved, hint: "All time" },
    { label: "Days taken", value: row.days_taken, hint: "Approved days" },
  ];
}

export async function getDashboardStats(user: CurrentUser): Promise<Stat[]> {
  switch (user.role) {
    case "admin":
      return getAdminStats();
    case "hr":
      return getHrStats();
    case "manager":
      return getManagerStats(user.id);
    default:
      return getEmployeeStats(user.id);
  }
}
