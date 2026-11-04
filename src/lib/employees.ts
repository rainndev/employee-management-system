import "server-only";

import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { isWorkingEmployeeStatus } from "@/lib/employee-status";
import { ensureLeaveBalances } from "@/lib/leave";

export type EmployeeListItem = EmployeeDetail & {
  name: string;
  department: string | null;
  position: string | null;
  userEmail: string | null;
};

// Minimal representation for read-only directory viewers (e.g. managers).
// Deliberately excludes birthdate, phone, address, linked user id and manager id.
export type EmployeeDirectoryItem = {
  id: string;
  employeeNo: string;
  name: string;
  department: string | null;
  position: string | null;
  status: string;
  hireDate: string;
};

export type EmployeeTableItem = EmployeeDirectoryItem & Partial<EmployeeDetail>;

export type EmployeeDetail = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  gender: string;
  phone: string;
  address: string;
  hireDate: string;
  status: string;
  departmentId: string;
  positionId: string;
  managerId: string;
  userId: string;
};

export type EmployeeInput = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  birthdate: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  hireDate: string | null;
  status: string;
  departmentId: string | null;
  positionId: string | null;
  managerId: string | null;
  userId: string | null;
};

export type Option = {
  id: string;
  label: string;
  gender?: string;
};

export class EmployeeNotFoundError extends Error {
  constructor() {
    super("Employee not found.");
    this.name = "EmployeeNotFoundError";
  }
}

export class EmployeeValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message);
    this.name = "EmployeeValidationError";
  }
}

export class LastActiveAdminError extends Error {
  constructor() {
    super(
      "This is the last active admin. Assign another admin before deactivating this account."
    );
    this.name = "LastActiveAdminError";
  }
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

async function deactivateUser(client: PoolClient, userId: string) {
  const { rows } = await client.query<{ role: string; is_active: boolean }>(
    'SELECT role, is_active FROM "user" WHERE id = $1 FOR UPDATE',
    [userId]
  );

  const user = rows[0];

  if (!user || !user.is_active) {
    return;
  }

  if (user.role === "admin") {
    // Lock active admins so two concurrent offboardings cannot both remove the
    // final admin. The second transaction will see the first one's update.
    const { rows: admins } = await client.query(
      "SELECT id FROM \"user\" WHERE role = 'admin' AND is_active FOR UPDATE"
    );

    if (admins.length <= 1) {
      throw new LastActiveAdminError();
    }
  }

  await client.query('UPDATE "user" SET is_active = false WHERE id = $1', [
    userId,
  ]);
}

async function cancelOpenLeaveForEmployee(
  client: PoolClient,
  employeeId: string,
  reason: string,
  actorUserId: string | null
) {
  const { rows } = await client.query<{
    id: string;
    leave_type_id: string;
    days: number;
    year: number;
    status: string;
  }>(
    `SELECT id,
            leave_type_id,
            days::float8 AS days,
            EXTRACT(YEAR FROM start_date)::int AS year,
            status
     FROM leave_request
     WHERE employee_id = $1
       AND (
         status = 'pending'
         OR (status = 'approved' AND start_date >= CURRENT_DATE)
       )
     FOR UPDATE`,
    [employeeId]
  );

  let pendingCancelled = 0;
  let approvedCancelled = 0;

  for (const request of rows) {
    if (request.status === "approved") {
      await ensureLeaveBalances(client, employeeId, request.year);
      await client.query(
        `UPDATE leave_balance
         SET used = GREATEST(used - $1, 0)
         WHERE employee_id = $2
           AND leave_type_id = $3
           AND year = $4`,
        [request.days, employeeId, request.leave_type_id, request.year]
      );
      approvedCancelled += 1;
    } else {
      pendingCancelled += 1;
    }

    await client.query(
      `UPDATE leave_request
       SET status = 'cancelled',
           decided_at = now(),
           remark = $2
       WHERE id = $1 AND status IN ('pending', 'approved')`,
      [request.id, reason]
    );

    await recordAudit(client, {
      actorUserId,
      action: "leave.cancel",
      entity: "leave_request",
      entityId: request.id,
      details: {
        employeeId,
        days: request.days,
        automatic: true,
        reason,
      },
    });
  }

  return { pendingCancelled, approvedCancelled };
}

async function clearDirectReports(client: PoolClient, managerId: string) {
  const { rowCount } = await client.query(
    `UPDATE employee
     SET manager_id = NULL
     WHERE manager_id = $1 AND id <> $1`,
    [managerId]
  );

  return rowCount ?? 0;
}

// JOINs department, position and user so the list can show names instead of
// ids, and returns every editable field so the edit dialog can be prefilled.
export async function listEmployees(): Promise<EmployeeListItem[]> {
  const { rows } = await pool.query<{
    id: string;
    employee_no: string;
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: string;
    phone: string;
    address: string;
    hire_date: string;
    status: string;
    department_id: string;
    position_id: string;
    manager_id: string;
    user_id: string;
    department: string | null;
    position: string | null;
    user_email: string | null;
  }>(
    `SELECT e.id,
            e.employee_no,
            e.first_name,
            e.last_name,
            coalesce(to_char(e.birthdate, 'YYYY-MM-DD'), '') AS birthdate,
            coalesce(e.gender, '') AS gender,
            coalesce(e.phone, '') AS phone,
            coalesce(e.address, '') AS address,
            coalesce(to_char(e.hire_date, 'YYYY-MM-DD'), '') AS hire_date,
            e.status,
            coalesce(e.department_id::text, '') AS department_id,
            coalesce(e.position_id::text, '') AS position_id,
            coalesce(e.manager_id::text, '') AS manager_id,
            coalesce(e.user_id::text, '') AS user_id,
            d.name AS department,
            p.title AS position,
            u.email AS user_email
     FROM employee e
     LEFT JOIN department d ON d.id = e.department_id
     LEFT JOIN position p ON p.id = e.position_id
     LEFT JOIN "user" u ON u.id = e.user_id
     WHERE e.deleted_at IS NULL
     ORDER BY e.last_name ASC, e.first_name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    employeeNo: row.employee_no,
    firstName: row.first_name,
    lastName: row.last_name,
    birthdate: row.birthdate,
    gender: row.gender,
    phone: row.phone,
    address: row.address,
    hireDate: row.hire_date,
    status: row.status,
    departmentId: row.department_id,
    positionId: row.position_id,
    managerId: row.manager_id,
    userId: row.user_id,
    name: `${row.first_name} ${row.last_name}`,
    department: row.department,
    position: row.position,
    userEmail: row.user_email,
  }));
}

export async function listEmployeeDirectory(
  managerEmployeeId?: string
): Promise<EmployeeDirectoryItem[]> {
  const { rows } = await pool.query<{
    id: string;
    employee_no: string;
    first_name: string;
    last_name: string;
    hire_date: string;
    status: string;
    department: string | null;
    position: string | null;
  }>(
    `SELECT e.id,
            e.employee_no,
            e.first_name,
            e.last_name,
            coalesce(to_char(e.hire_date, 'YYYY-MM-DD'), '') AS hire_date,
            e.status,
            d.name AS department,
            p.title AS position
     FROM employee e
     LEFT JOIN department d ON d.id = e.department_id
     LEFT JOIN position p ON p.id = e.position_id
     WHERE e.deleted_at IS NULL
       AND ($1::uuid IS NULL OR e.manager_id = $1)
     ORDER BY e.last_name ASC, e.first_name ASC`,
    [managerEmployeeId ?? null]
  );

  return rows.map((row) => ({
    id: row.id,
    employeeNo: row.employee_no,
    name: `${row.first_name} ${row.last_name}`,
    department: row.department,
    position: row.position,
    status: row.status,
    hireDate: row.hire_date,
  }));
}

export async function listManagerOptions(
  excludeId?: string
): Promise<Option[]> {
  const { rows } = await pool.query<{ id: string; label: string }>(
    `SELECT id, first_name || ' ' || last_name AS label
     FROM employee
     WHERE deleted_at IS NULL
       AND status IN ('active', 'on_leave')
       AND ($1::uuid IS NULL OR id <> $1)
     ORDER BY last_name ASC, first_name ASC`,
    [excludeId ?? null]
  );

  return rows;
}

export async function listEmployeeOptions(): Promise<Option[]> {
  const { rows } = await pool.query<{
    id: string;
    label: string;
    gender: string;
  }>(
    `SELECT id,
            first_name || ' ' || last_name AS label,
            coalesce(gender, '') AS gender
     FROM employee
     WHERE deleted_at IS NULL
       AND status IN ('active', 'on_leave')
     ORDER BY last_name ASC, first_name ASC`
  );

  return rows;
}

// Users that do not have an employee record yet (LEFT JOIN + IS NULL), plus an
// optional already-linked user so the edit form can keep its current selection.
// Disabled accounts are only offered when they are already linked.
export async function listUserOptions(includeId?: string): Promise<Option[]> {
  const { rows } = await pool.query<{ id: string; label: string }>(
    `SELECT u.id, u.email AS label
     FROM "user" u
     LEFT JOIN employee e ON e.user_id = u.id AND e.deleted_at IS NULL
     WHERE (e.id IS NULL AND u.is_active)
        OR ($1::uuid IS NOT NULL AND u.id = $1)
     ORDER BY u.email ASC`,
    [includeId ?? null]
  );

  return rows;
}

export async function getEmployeeAssignments(id: string) {
  const { rows } = await pool.query<{
    id: string;
    manager_id: string | null;
    user_id: string | null;
    department_id: string | null;
    position_id: string | null;
  }>(
    `SELECT id,
            manager_id::text,
            user_id::text,
            department_id::text,
            position_id::text
     FROM employee
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  return rows[0] ?? null;
}

export async function validateEmployeeReferences(
  input: EmployeeInput,
  current?: {
    id: string;
    managerId: string | null;
    userId: string | null;
    departmentId: string | null;
    positionId: string | null;
  }
) {
  if (input.departmentId) {
    const keepingCurrentDepartment =
      current?.departmentId === input.departmentId;
    const { rowCount } = await pool.query(
      "SELECT 1 FROM department WHERE id = $1 AND deleted_at IS NULL",
      [input.departmentId]
    );

    if (!rowCount && !keepingCurrentDepartment) {
      throw new EmployeeValidationError(
        "departmentId",
        "That department is no longer available."
      );
    }
  }

  if (input.positionId) {
    const keepingCurrentPosition = current?.positionId === input.positionId;
    const { rowCount } = await pool.query(
      "SELECT 1 FROM position WHERE id = $1 AND deleted_at IS NULL",
      [input.positionId]
    );

    if (!rowCount && !keepingCurrentPosition) {
      throw new EmployeeValidationError(
        "positionId",
        "That position is no longer available."
      );
    }
  }

  if (input.managerId) {
    if (current && input.managerId === current.id) {
      throw new EmployeeValidationError(
        "managerId",
        "An employee cannot be their own manager."
      );
    }

    const { rows } = await pool.query<{ status: string }>(
      `SELECT status
       FROM employee
       WHERE id = $1 AND deleted_at IS NULL`,
      [input.managerId]
    );

    const manager = rows[0];

    if (!manager) {
      throw new EmployeeValidationError(
        "managerId",
        "That manager no longer exists."
      );
    }

    const keepingCurrentManager = current?.managerId === input.managerId;

    if (!isWorkingEmployeeStatus(manager.status) && !keepingCurrentManager) {
      throw new EmployeeValidationError(
        "managerId",
        "That manager is not an active employee."
      );
    }

    if (current) {
      const cycle = await wouldCreateManagerCycle(current.id, input.managerId);

      if (cycle) {
        throw new EmployeeValidationError(
          "managerId",
          "That manager would create a reporting cycle."
        );
      }
    }
  }

  if (input.userId) {
    const { rows } = await pool.query<{ is_active: boolean }>(
      'SELECT is_active FROM "user" WHERE id = $1',
      [input.userId]
    );

    const user = rows[0];

    if (!user) {
      throw new EmployeeValidationError(
        "userId",
        "That user account no longer exists."
      );
    }

    const keepingCurrentUser = current?.userId === input.userId;

    if (!user.is_active && !keepingCurrentUser) {
      throw new EmployeeValidationError(
        "userId",
        "That user account is disabled. Enable it before linking."
      );
    }

    const { rowCount } = await pool.query(
      `SELECT 1
       FROM employee
       WHERE user_id = $1 AND deleted_at IS NULL
         AND ($2::uuid IS NULL OR id <> $2::uuid)`,
      [input.userId, current?.id ?? null]
    );

    if (rowCount) {
      throw new EmployeeValidationError(
        "userId",
        "That user account is already linked to another employee."
      );
    }
  }
}

export async function wouldCreateManagerCycle(
  employeeId: string,
  managerId: string
) {
  const { rowCount } = await pool.query(
    `WITH RECURSIVE chain AS (
       SELECT id, manager_id
       FROM employee
       WHERE id = $1 AND deleted_at IS NULL
       UNION ALL
       SELECT e.id, e.manager_id
       FROM employee e
       JOIN chain c ON e.id = c.manager_id
       WHERE e.deleted_at IS NULL
     )
     SELECT 1
     FROM chain
     WHERE id = $2
     LIMIT 1`,
    [managerId, employeeId]
  );

  return Boolean(rowCount);
}

export async function createEmployee(
  input: EmployeeInput,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO employee
         (employee_no, first_name, last_name, birthdate, gender, phone, address,
          hire_date, status, department_id, position_id, manager_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        input.employeeNo,
        input.firstName,
        input.lastName,
        input.birthdate,
        input.gender,
        input.phone,
        input.address,
        input.hireDate,
        input.status,
        input.departmentId,
        input.positionId,
        input.managerId,
        input.userId,
      ]
    );

    const employeeId = rows[0].id;

    if (input.userId && !isWorkingEmployeeStatus(input.status)) {
      await deactivateUser(client, input.userId);
    }

    await recordAudit(client, {
      actorUserId,
      action: "employee.create",
      entity: "employee",
      entityId: employeeId,
      details: { employeeNo: input.employeeNo, status: input.status },
    });

    return employeeId;
  });
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows: existingRows } = await client.query<{
      user_id: string | null;
    }>(
      `SELECT user_id::text
       FROM employee
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [id]
    );

    if (!existingRows[0]) {
      throw new EmployeeNotFoundError();
    }

    const previousUserId = existingRows[0].user_id;

    const { rows } = await client.query<{
      id: string;
      user_id: string | null;
      status: string;
    }>(
      `UPDATE employee
       SET employee_no = $1,
           first_name = $2,
           last_name = $3,
           birthdate = $4,
           gender = $5,
           phone = $6,
           address = $7,
           hire_date = $8,
           status = $9,
           department_id = $10,
           position_id = $11,
           manager_id = $12,
           user_id = $13
       WHERE id = $14 AND deleted_at IS NULL
       RETURNING id, user_id, status`,
      [
        input.employeeNo,
        input.firstName,
        input.lastName,
        input.birthdate,
        input.gender,
        input.phone,
        input.address,
        input.hireDate,
        input.status,
        input.departmentId,
        input.positionId,
        input.managerId,
        input.userId,
        id,
      ]
    );

    const updated = rows[0];

    if (!updated) {
      throw new EmployeeNotFoundError();
    }

    let pendingLeaveCancelled = 0;
    let approvedLeaveCancelled = 0;
    let reportsUnassigned = 0;

    if (!isWorkingEmployeeStatus(updated.status)) {
      const userIds = [
        ...new Set(
          [previousUserId, updated.user_id].filter((value): value is string =>
            Boolean(value)
          )
        ),
      ];

      // Deactivate sequentially so the last-admin guard sees prior updates.
      for (const userId of userIds) {
        await deactivateUser(client, userId);
      }

      const leave = await cancelOpenLeaveForEmployee(
        client,
        id,
        "Cancelled because the employee is no longer active.",
        actorUserId
      );

      pendingLeaveCancelled = leave.pendingCancelled;
      approvedLeaveCancelled = leave.approvedCancelled;
      reportsUnassigned = await clearDirectReports(client, id);
    }

    await recordAudit(client, {
      actorUserId,
      action: "employee.update",
      entity: "employee",
      entityId: id,
      details: {
        employeeNo: input.employeeNo,
        status: input.status,
        pendingLeaveCancelled,
        approvedLeaveCancelled,
        reportsUnassigned,
      },
    });

    return updated;
  });
}

export async function softDeleteEmployee(
  id: string,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{
      id: string;
      user_id: string | null;
    }>(
      `UPDATE employee
       SET deleted_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, user_id`,
      [id]
    );

    const deleted = rows[0];

    if (!deleted) {
      return false;
    }

    if (deleted.user_id) {
      await deactivateUser(client, deleted.user_id);
    }

    const leave = await cancelOpenLeaveForEmployee(
      client,
      id,
      "Cancelled because the employee record was deleted.",
      actorUserId
    );

    const reportsUnassigned = await clearDirectReports(client, id);

    await recordAudit(client, {
      actorUserId,
      action: "employee.delete",
      entity: "employee",
      entityId: id,
      details: {
        pendingLeaveCancelled: leave.pendingCancelled,
        approvedLeaveCancelled: leave.approvedCancelled,
        reportsUnassigned,
      },
    });

    return true;
  });
}
