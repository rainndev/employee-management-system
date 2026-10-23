import "server-only";

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

export async function createLeaveRequest(input: LeaveRequestInput) {
  await pool.query(
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
  await pool.query(
    `UPDATE leave_request
     SET status = $1, approver_id = $2, decided_at = now()
     WHERE id = $3 AND status = 'pending'`,
    [status, approverId, id]
  );
}

export async function deleteLeaveRequest(id: string) {
  await pool.query("DELETE FROM leave_request WHERE id = $1", [id]);
}
