import "server-only";

import type { PoolClient } from "pg";
import { pool } from "@/lib/db";

export type LeaveType = {
  id: string;
  name: string;
  defaultDays: number;
  isPaid: boolean;
};

export type LeaveRequestItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  approverName: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type LeaveRequestInput = {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
};

export type LeaveBalanceItem = {
  leaveTypeId: string;
  leaveType: string;
  isPaid: boolean;
  allocated: number;
  used: number;
  pending: number;
  // null for uncapped (unpaid) types.
  available: number | null;
};

export class InsufficientLeaveBalanceError extends Error {
  constructor(
    public readonly leaveType: string,
    public readonly available: number,
    public readonly requested: number
  ) {
    super(
      `Only ${formatDays(available)} ${leaveType} ${
        available === 1 ? "day" : "days"
      } left, but ${formatDays(requested)} requested.`
    );
    this.name = "InsufficientLeaveBalanceError";
  }
}

function formatDays(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Create the per-employee/type/year rows the first time they are needed.
export async function ensureLeaveBalances(
  client: PoolClient,
  employeeId: string,
  year: number
) {
  await client.query(
    `INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
     SELECT $1, lt.id, $2, lt.default_days
     FROM leave_type lt
     ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
    [employeeId, year]
  );
}

export async function listLeaveTypes(): Promise<LeaveType[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    default_days: number;
    is_paid: boolean;
  }>(
    `SELECT id, name, default_days, is_paid
     FROM leave_type
     ORDER BY name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    defaultDays: row.default_days,
    isPaid: row.is_paid,
  }));
}

export async function getLeaveBalances(
  employeeId: string,
  year = new Date().getFullYear()
): Promise<LeaveBalanceItem[]> {
  await pool.query(
    `INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
     SELECT $1, lt.id, $2, lt.default_days
     FROM leave_type lt
     ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`,
    [employeeId, year]
  );

  const { rows } = await pool.query<{
    id: string;
    name: string;
    is_paid: boolean;
    allocated: number;
    used: number;
    pending: number;
  }>(
    `SELECT lt.id,
            lt.name,
            lt.is_paid,
            lb.allocated::float8 AS allocated,
            lb.used::float8 AS used,
            coalesce(p.pending, 0)::float8 AS pending
     FROM leave_balance lb
     JOIN leave_type lt ON lt.id = lb.leave_type_id
     LEFT JOIN (
       SELECT leave_type_id, sum(days) AS pending
       FROM leave_request
       WHERE employee_id = $1
         AND status = 'pending'
         AND EXTRACT(YEAR FROM start_date)::int = $2
       GROUP BY leave_type_id
     ) p ON p.leave_type_id = lb.leave_type_id
     WHERE lb.employee_id = $1 AND lb.year = $2
     ORDER BY lt.name ASC`,
    [employeeId, year]
  );

  return rows.map((row) => {
    const remaining = row.allocated - row.used - row.pending;

    return {
      leaveTypeId: row.id,
      leaveType: row.name,
      isPaid: row.is_paid,
      allocated: row.allocated,
      used: row.used,
      pending: row.pending,
      available: row.is_paid ? Math.max(remaining, 0) : null,
    };
  });
}

// JOINs employee, leave_type and the approving employee.
export async function listLeaveRequests(
  employeeId?: string
): Promise<LeaveRequestItem[]> {
  const where = employeeId ? "WHERE lr.employee_id = $1" : "";
  const params = employeeId ? [employeeId] : [];

  const { rows } = await pool.query<{
    id: string;
    employee_id: string;
    employee_name: string;
    employee_no: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    status: string;
    reason: string | null;
    approver_name: string | null;
    created_at: string;
    decided_at: string | null;
  }>(
    `SELECT lr.id,
            lr.employee_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.employee_no,
            lt.name AS leave_type,
            to_char(lr.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lr.days::float8 AS days,
            lr.status,
            lr.reason,
            a.first_name || ' ' || a.last_name AS approver_name,
            to_char(lr.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
            to_char(lr.decided_at, 'YYYY-MM-DD HH24:MI') AS decided_at
     FROM leave_request lr
     JOIN employee e ON e.id = lr.employee_id
     JOIN leave_type lt ON lt.id = lr.leave_type_id
     LEFT JOIN employee a ON a.id = lr.approver_id
     ${where}
     ORDER BY lr.start_date DESC`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeNo: row.employee_no,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    status: row.status,
    reason: row.reason,
    approverName: row.approver_name,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  }));
}

export async function getMyEmployeeId(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id
     FROM employee
     WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  return rows[0]?.id ?? null;
}

// Pending and approved requests hold the dates; rejected/cancelled ones do not.
export async function hasOverlappingLeaveRequest(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<boolean> {
  const { rows } = await pool.query<{ overlaps: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM leave_request
       WHERE employee_id = $1
         AND status IN ('pending', 'approved')
         AND start_date <= $3::date
         AND end_date >= $2::date
         AND ($4::uuid IS NULL OR id <> $4::uuid)
     ) AS overlaps`,
    [employeeId, startDate, endDate, excludeId ?? null]
  );

  return rows[0]?.overlaps ?? false;
}

export async function createLeaveRequest(input: LeaveRequestInput) {
  const year = Number(input.startDate.slice(0, 4));

  await withTransaction(async (client) => {
    await ensureLeaveBalances(client, input.employeeId, year);

    // Lock the balance row so concurrent requests for this employee/type/year
    // cannot both read the same remaining days.
    const { rows } = await client.query<{
      allocated: number;
      used: number;
      leave_type: string;
      is_paid: boolean;
    }>(
      `SELECT lb.allocated::float8 AS allocated,
              lb.used::float8 AS used,
              lt.name AS leave_type,
              lt.is_paid
       FROM leave_balance lb
       JOIN leave_type lt ON lt.id = lb.leave_type_id
       WHERE lb.employee_id = $1
         AND lb.leave_type_id = $2
         AND lb.year = $3
       FOR UPDATE OF lb`,
      [input.employeeId, input.leaveTypeId, year]
    );

    const balance = rows[0];

    if (balance?.is_paid) {
      const { rows: pendingRows } = await client.query<{ pending: number }>(
        `SELECT coalesce(sum(days), 0)::float8 AS pending
         FROM leave_request
         WHERE employee_id = $1
           AND leave_type_id = $2
           AND status = 'pending'
           AND EXTRACT(YEAR FROM start_date)::int = $3`,
        [input.employeeId, input.leaveTypeId, year]
      );

      const available =
        balance.allocated - balance.used - pendingRows[0].pending;

      if (input.days > available) {
        throw new InsufficientLeaveBalanceError(
          balance.leave_type,
          Math.max(available, 0),
          input.days
        );
      }
    }

    await client.query(
      `INSERT INTO leave_request
         (employee_id, leave_type_id, start_date, end_date, days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [
        input.employeeId,
        input.leaveTypeId,
        input.startDate,
        input.endDate,
        input.days,
        input.reason,
      ]
    );
  });
}

export async function getLeaveRequest(id: string) {
  const { rows } = await pool.query<{
    id: string;
    employee_id: string;
    status: string;
  }>(
    `SELECT id, employee_id, status
     FROM leave_request
     WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function setLeaveStatus(
  id: string,
  status: "approved" | "rejected",
  approverId: string
) {
  await withTransaction(async (client) => {
    const { rows } = await client.query<{
      id: string;
      employee_id: string;
      leave_type_id: string;
      days: number;
      year: number;
      status: string;
      leave_type: string;
      is_paid: boolean;
    }>(
      `SELECT lr.id,
              lr.employee_id,
              lr.leave_type_id,
              lr.days::float8 AS days,
              EXTRACT(YEAR FROM lr.start_date)::int AS year,
              lr.status,
              lt.name AS leave_type,
              lt.is_paid
       FROM leave_request lr
       JOIN leave_type lt ON lt.id = lr.leave_type_id
       WHERE lr.id = $1
       FOR UPDATE OF lr`,
      [id]
    );

    const request = rows[0];

    if (!request || request.status !== "pending") {
      return;
    }

    if (status === "approved") {
      await ensureLeaveBalances(client, request.employee_id, request.year);

      const { rows: balanceRows } = await client.query<{
        allocated: number;
        used: number;
      }>(
        `SELECT allocated::float8 AS allocated, used::float8 AS used
         FROM leave_balance
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3
         FOR UPDATE`,
        [request.employee_id, request.leave_type_id, request.year]
      );

      const balance = balanceRows[0];

      if (balance) {
        if (request.is_paid) {
          const available = balance.allocated - balance.used;
          if (request.days > available) {
            throw new InsufficientLeaveBalanceError(
              request.leave_type,
              Math.max(available, 0),
              request.days
            );
          }
        }

        await client.query(
          `UPDATE leave_balance
           SET used = used + $1
           WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
          [request.days, request.employee_id, request.leave_type_id, request.year]
        );
      }
    }

    await client.query(
      `UPDATE leave_request
       SET status = $1, approver_id = $2, decided_at = now()
       WHERE id = $3 AND status = 'pending'`,
      [status, approverId, id]
    );
  });
}

export async function deleteLeaveRequest(id: string) {
  await withTransaction(async (client) => {
    const { rows } = await client.query<{
      employee_id: string;
      leave_type_id: string;
      days: number;
      year: number;
      status: string;
    }>(
      `SELECT employee_id,
              leave_type_id,
              days::float8 AS days,
              EXTRACT(YEAR FROM start_date)::int AS year,
              status
       FROM leave_request
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    const request = rows[0];

    if (!request) {
      return;
    }

    // Approved days were counted against the balance; deleting them restores
    // the allowance. Pending days were only reserved and never added to used.
    if (request.status === "approved") {
      await ensureLeaveBalances(client, request.employee_id, request.year);
      await client.query(
        `UPDATE leave_balance
         SET used = GREATEST(used - $1, 0)
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [request.days, request.employee_id, request.leave_type_id, request.year]
      );
    }

    await client.query("DELETE FROM leave_request WHERE id = $1", [id]);
  });
}
