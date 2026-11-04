import "server-only";

import { pool } from "@/lib/db";
import type { Role } from "@/lib/roles";

export type AdminStats = {
  employees: number;
  departments: number;
  positions: number;
  users: number;
  pendingLeaveRequests: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const { rows } = await pool.query<{
    employees: number;
    departments: number;
    positions: number;
    users: number;
    pending_leave_requests: number;
  }>(`
    SELECT
      (SELECT count(*) FROM employee WHERE deleted_at IS NULL)::int AS employees,
      (SELECT count(*) FROM department WHERE deleted_at IS NULL)::int AS departments,
      (SELECT count(*) FROM position WHERE deleted_at IS NULL)::int AS positions,
      (SELECT count(*) FROM "user")::int AS users,
      (SELECT count(*) FROM leave_request WHERE status = 'pending')::int AS pending_leave_requests
  `);

  const row = rows[0];

  return {
    employees: row.employees,
    departments: row.departments,
    positions: row.positions,
    users: row.users,
    pendingLeaveRequests: row.pending_leave_requests,
  };
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const { rows } = await pool.query<{
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>(
    `SELECT id,
            email,
            role,
            is_active,
            to_char(created_at, 'YYYY-MM-DD') AS created_at
     FROM "user"
     ORDER BY created_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as Role,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

export type SignupPoint = {
  date: string;
  users: number;
};

// Daily signup counts for the last `days` days, including days with no users.
export async function getSignupSeries(days = 90): Promise<SignupPoint[]> {
  const { rows } = await pool.query<{ day: string; users: number }>(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
            count(u.id)::int AS users
     FROM generate_series(
            CURRENT_DATE - ($1::int - 1),
            CURRENT_DATE,
            interval '1 day'
          ) AS d(day)
     LEFT JOIN "user" u
       ON u.created_at >= d.day
      AND u.created_at < d.day + interval '1 day'
     GROUP BY d.day
     ORDER BY d.day`,
    [days]
  );

  return rows.map((row) => ({ date: row.day, users: row.users }));
}
