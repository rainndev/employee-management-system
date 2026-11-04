import "server-only";

import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { isWorkingEmployeeStatus } from "@/lib/employee-status";
import type { Role } from "@/lib/roles";

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
  managerId: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  remark: string | null;
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

export class LeaveRequestNotFoundError extends Error {
  constructor() {
    super("Leave request not found.");
    this.name = "LeaveRequestNotFoundError";
  }
}

export class LeaveRequestNotPendingError extends Error {
  constructor(message = "This request has already been decided.") {
    super(message);
    this.name = "LeaveRequestNotPendingError";
  }
}

export class LeaveRequestNotCancellableError extends Error {
  constructor(message = "Only pending or approved requests can be cancelled.") {
    super(message);
    this.name = "LeaveRequestNotCancellableError";
  }
}

export class SelfApprovalError extends Error {
  constructor() {
    super("You cannot approve or reject your own leave request.");
    this.name = "SelfApprovalError";
  }
}

export class NotTeamMemberError extends Error {
  constructor() {
    super("You can only approve leave for your direct reports.");
    this.name = "NotTeamMemberError";
  }
}

export class EmployeeNotEligibleError extends Error {
  constructor(message = "That employee is not active.") {
    super(message);
    this.name = "EmployeeNotEligibleError";
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

export type LeaveListScope = {
  employeeId?: string;
  // Manager view: the manager's own employee id. Includes their own requests
  // plus requests from employees who report directly to them.
  managerEmployeeId?: string;
};

// JOINs employee, leave_type and the approving employee.
export async function listLeaveRequests(
  scope: LeaveListScope = {}
): Promise<LeaveRequestItem[]> {
  const clauses: string[] = [];
  const params: string[] = [];

  if (scope.employeeId) {
    params.push(scope.employeeId);
    clauses.push(`lr.employee_id = $${params.length}`);
  } else if (scope.managerEmployeeId) {
    params.push(scope.managerEmployeeId);
    clauses.push(
      `(lr.employee_id = $${params.length} OR e.manager_id = $${params.length})`
    );
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const { rows } = await pool.query<{
    id: string;
    employee_id: string;
    employee_name: string;
    employee_no: string;
    manager_id: string | null;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    status: string;
    reason: string | null;
    remark: string | null;
    approver_name: string | null;
    created_at: string;
    decided_at: string | null;
  }>(
    `SELECT lr.id,
            lr.employee_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.employee_no,
            e.manager_id::text AS manager_id,
            lt.name AS leave_type,
            to_char(lr.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lr.days::float8 AS days,
            lr.status,
            lr.reason,
            lr.remark,
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
    managerId: row.manager_id,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    status: row.status,
    reason: row.reason,
    remark: row.remark,
    approverName: row.approver_name,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  }));
}

export async function getMyEmployeeId(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id
     FROM employee
     WHERE user_id = $1
       AND deleted_at IS NULL
       AND status IN ('active', 'on_leave')`,
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

export async function createLeaveRequest(
  input: LeaveRequestInput,
  actorUserId: string | null
) {
  const year = Number(input.startDate.slice(0, 4));

  return withTransaction(async (client) => {
    const { rows: employeeRows } = await client.query<{
      status: string;
    }>(
      `SELECT status
       FROM employee
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [input.employeeId]
    );

    const employee = employeeRows[0];

    if (!employee || !isWorkingEmployeeStatus(employee.status)) {
      throw new EmployeeNotEligibleError(
        "Leave can only be filed for an active employee."
      );
    }

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

    const { rows: inserted } = await client.query<{ id: string }>(
      `INSERT INTO leave_request
         (employee_id, leave_type_id, start_date, end_date, days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [
        input.employeeId,
        input.leaveTypeId,
        input.startDate,
        input.endDate,
        input.days,
        input.reason,
      ]
    );

    await recordAudit(client, {
      actorUserId,
      action: "leave.create",
      entity: "leave_request",
      entityId: inserted[0].id,
      details: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        days: input.days,
      },
    });

    return inserted[0].id;
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
  approverId: string,
  approverRole: Role,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{
      id: string;
      employee_id: string;
      manager_id: string | null;
      employee_status: string;
      employee_deleted_at: string | null;
      leave_type_id: string;
      days: number;
      year: number;
      status: string;
      leave_type: string;
      is_paid: boolean;
    }>(
      `SELECT lr.id,
              lr.employee_id,
              e.manager_id::text AS manager_id,
              e.status AS employee_status,
              e.deleted_at::text AS employee_deleted_at,
              lr.leave_type_id,
              lr.days::float8 AS days,
              EXTRACT(YEAR FROM lr.start_date)::int AS year,
              lr.status,
              lt.name AS leave_type,
              lt.is_paid
       FROM leave_request lr
       JOIN employee e ON e.id = lr.employee_id
       JOIN leave_type lt ON lt.id = lr.leave_type_id
       WHERE lr.id = $1
       FOR UPDATE OF lr`,
      [id]
    );

    const request = rows[0];

    if (!request) {
      throw new LeaveRequestNotFoundError();
    }

    if (request.status !== "pending") {
      throw new LeaveRequestNotPendingError();
    }

    if (
      request.employee_deleted_at ||
      !isWorkingEmployeeStatus(request.employee_status)
    ) {
      throw new EmployeeNotEligibleError(
        "This request belongs to an employee who is no longer active."
      );
    }

    if (request.employee_id === approverId) {
      throw new SelfApprovalError();
    }

    if (approverRole === "manager" && request.manager_id !== approverId) {
      throw new NotTeamMemberError();
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
          [
            request.days,
            request.employee_id,
            request.leave_type_id,
            request.year,
          ]
        );
      }
    }

    const { rowCount } = await client.query(
      `UPDATE leave_request
       SET status = $1, approver_id = $2, decided_at = now()
       WHERE id = $3 AND status = 'pending'`,
      [status, approverId, id]
    );

    if (!rowCount) {
      throw new LeaveRequestNotPendingError();
    }

    await recordAudit(client, {
      actorUserId,
      action: status === "approved" ? "leave.approve" : "leave.reject",
      entity: "leave_request",
      entityId: id,
      details: { employeeId: request.employee_id, days: request.days },
    });
  });
}

export async function cancelLeaveRequest(
  id: string,
  actorUserId: string | null,
  reason: string
) {
  return withTransaction(async (client) => {
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
      throw new LeaveRequestNotFoundError();
    }

    if (request.status !== "pending" && request.status !== "approved") {
      throw new LeaveRequestNotCancellableError();
    }

    // Approved days were counted against the balance; cancelling them restores
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

    const { rowCount } = await client.query(
      `UPDATE leave_request
       SET status = 'cancelled',
           decided_at = now(),
           remark = $2
       WHERE id = $1 AND status IN ('pending', 'approved')`,
      [id, reason]
    );

    if (!rowCount) {
      throw new LeaveRequestNotCancellableError();
    }

    await recordAudit(client, {
      actorUserId,
      action: "leave.cancel",
      entity: "leave_request",
      entityId: id,
      details: { employeeId: request.employee_id, days: request.days },
    });
  });
}
