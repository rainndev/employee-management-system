// TEST DATA ONLY: creates one login per role plus linked employee records.
//
// Run from the project root:
//   node --env-file=.env.local db/seed-test-accounts.mjs
//
// Idempotent: re-running updates the existing rows instead of duplicating them.

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DEPARTMENTS = ["Engineering", "Human Resources", "Operations"];
const POSITIONS = ["Software Engineer", "HR Specialist", "Engineering Manager"];

const ACCOUNTS = [
  {
    email: "admin@ems.test",
    password: "Admin1234",
    role: "admin",
    employeeNo: "E-1001",
    first: "Ada",
    last: "Admin",
    department: "Engineering",
    position: "Software Engineer",
  },
  {
    email: "hr@ems.test",
    password: "Hr123456",
    role: "hr",
    employeeNo: "E-1002",
    first: "Hana",
    last: "Payroll",
    department: "Human Resources",
    position: "HR Specialist",
  },
  {
    email: "manager@ems.test",
    password: "Manager123",
    role: "manager",
    employeeNo: "E-1003",
    first: "Mia",
    last: "Lead",
    department: "Engineering",
    position: "Engineering Manager",
  },
  {
    email: "employee@ems.test",
    password: "Employee123",
    role: "employee",
    employeeNo: "E-1004",
    first: "Eli",
    last: "Staff",
    department: "Engineering",
    position: "Software Engineer",
  },
];

const MANAGER_EMPLOYEE_NO = "E-1003";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const departmentIds = {};
  for (const name of DEPARTMENTS) {
    const existing = await client.query(
      "SELECT id FROM department WHERE name = $1 AND deleted_at IS NULL",
      [name]
    );
    if (existing.rows[0]) {
      departmentIds[name] = existing.rows[0].id;
    } else {
      const { rows } = await client.query(
        "INSERT INTO department (name) VALUES ($1) RETURNING id",
        [name]
      );
      departmentIds[name] = rows[0].id;
    }
  }

  const positionIds = {};
  for (const title of POSITIONS) {
    const existing = await client.query(
      "SELECT id FROM position WHERE title = $1 AND deleted_at IS NULL",
      [title]
    );
    if (existing.rows[0]) {
      positionIds[title] = existing.rows[0].id;
    } else {
      const { rows } = await client.query(
        "INSERT INTO position (title) VALUES ($1) RETURNING id",
        [title]
      );
      positionIds[title] = rows[0].id;
    }
  }

  for (const account of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);

    const user = await client.query(
      `INSERT INTO "user" (email, password_hash, role, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             is_active = true
       RETURNING id`,
      [account.email, passwordHash, account.role]
    );

    await client.query(
      `INSERT INTO employee
         (employee_no, first_name, last_name, hire_date, status, department_id, position_id, user_id)
       VALUES ($1, $2, $3, CURRENT_DATE, 'active', $4, $5, $6)
       ON CONFLICT (employee_no) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             status = 'active',
             department_id = EXCLUDED.department_id,
             position_id = EXCLUDED.position_id,
             user_id = EXCLUDED.user_id,
             deleted_at = NULL`,
      [
        account.employeeNo,
        account.first,
        account.last,
        departmentIds[account.department],
        positionIds[account.position],
        user.rows[0].id,
      ]
    );
  }

  // Place the employee under the manager.
  const manager = await client.query(
    "SELECT id FROM employee WHERE employee_no = $1",
    [MANAGER_EMPLOYEE_NO]
  );
  await client.query(
    "UPDATE employee SET manager_id = $1 WHERE employee_no = $2",
    [manager.rows[0].id, "E-1004"]
  );

  // One pending request so approval can be tested immediately.
  const leaveType = await client.query(
    "SELECT id FROM leave_type WHERE name = 'Vacation' LIMIT 1"
  );
  const employee = await client.query(
    "SELECT id FROM employee WHERE employee_no = 'E-1004'"
  );

  if (leaveType.rows[0] && employee.rows[0]) {
    const existing = await client.query(
      `SELECT id FROM leave_request
       WHERE employee_id = $1 AND start_date = '2027-03-01'`,
      [employee.rows[0].id]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO leave_request
           (employee_id, leave_type_id, start_date, end_date, days, reason, status)
         VALUES ($1, $2, '2027-03-01', '2027-03-02', 2, 'Seeded sample request', 'pending')`,
        [employee.rows[0].id, leaveType.rows[0].id]
      );
    }
  }

  await client.query("COMMIT");

  for (const account of ACCOUNTS) {
    const { rows } = await client.query(
      'SELECT password_hash FROM "user" WHERE email = $1',
      [account.email]
    );
    const ok = await bcrypt.compare(account.password, rows[0].password_hash);
    console.log(
      `${ok ? "OK " : "BAD"} ${account.role.padEnd(8)} ${account.email} / ${account.password}`
    );
  }
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
