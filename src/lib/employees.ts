import "server-only";

import { pool } from "@/lib/db";

export type EmployeeListItem = EmployeeDetail & {
  name: string;
  department: string | null;
  position: string | null;
  userEmail: string | null;
};

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
};

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

export async function listManagerOptions(
  excludeId?: string
): Promise<Option[]> {
  const { rows } = await pool.query<{ id: string; label: string }>(
    `SELECT id, first_name || ' ' || last_name AS label
     FROM employee
     WHERE deleted_at IS NULL AND ($1::uuid IS NULL OR id <> $1)
     ORDER BY last_name ASC, first_name ASC`,
    [excludeId ?? null]
  );

  return rows;
}

export async function listEmployeeOptions(): Promise<Option[]> {
  const { rows } = await pool.query<{ id: string; label: string }>(
    `SELECT id, first_name || ' ' || last_name AS label
     FROM employee
     WHERE deleted_at IS NULL
     ORDER BY last_name ASC, first_name ASC`
  );

  return rows;
}

// Users that do not have an employee record yet (LEFT JOIN + IS NULL), plus an
// optional already-linked user so the edit form can keep its current selection.
export async function listUserOptions(includeId?: string): Promise<Option[]> {
  const { rows } = await pool.query<{ id: string; label: string }>(
    `SELECT u.id, u.email AS label
     FROM "user" u
     LEFT JOIN employee e ON e.user_id = u.id AND e.deleted_at IS NULL
     WHERE e.id IS NULL
        OR ($1::uuid IS NOT NULL AND u.id = $1)
     ORDER BY u.email ASC`,
    [includeId ?? null]
  );

  return rows;
}

export async function createEmployee(input: EmployeeInput) {
  await pool.query(
    `INSERT INTO employee
       (employee_no, first_name, last_name, birthdate, gender, phone, address,
        hire_date, status, department_id, position_id, manager_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  await pool.query(
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
     WHERE id = $14 AND deleted_at IS NULL`,
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
}

export async function softDeleteEmployee(id: string) {
  await pool.query(
    "UPDATE employee SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
}
