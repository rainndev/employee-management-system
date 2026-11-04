import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { adminDatabaseUrl, TEST_DB_NAME, testDatabaseUrl } from "./config";

const PASSWORD = "Passw0rd!";

async function runSqlFile(client: Client, file: string) {
  await client.query(readFileSync(file, "utf8"));
}

async function insertUser(
  client: Client,
  email: string,
  role: string,
  passwordHash: string
) {
  const { rows } = await client.query<{ id: string }>(
    'INSERT INTO "user" (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
    [email, passwordHash, role]
  );

  return rows[0].id;
}

async function insertEmployee(
  client: Client,
  input: {
    employeeNo: string;
    firstName: string;
    lastName: string;
    userId: string;
    managerId: string | null;
    departmentId: string;
    positionId: string;
    phone?: string;
    address?: string;
  }
) {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO employee
       (employee_no, first_name, last_name, birthdate, hire_date, status,
        department_id, position_id, manager_id, user_id, phone, address)
     VALUES ($1, $2, $3, DATE '1990-01-01', DATE '2020-01-01', 'active',
             $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      input.employeeNo,
      input.firstName,
      input.lastName,
      input.departmentId,
      input.positionId,
      input.managerId,
      input.userId,
      input.phone ?? null,
      input.address ?? null,
    ]
  );

  return rows[0].id;
}

async function seedFixtures(client: Client) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  const { rows: departmentRows } = await client.query<{ id: string }>(
    "SELECT id FROM department WHERE name = 'Engineering'"
  );
  const { rows: positionRows } = await client.query<{ id: string }>(
    "SELECT id FROM position WHERE title = 'Software Engineer'"
  );

  const departmentId = departmentRows[0].id;
  const positionId = positionRows[0].id;

  const managerUserId = await insertUser(
    client,
    "manager@e2e.test",
    "manager",
    passwordHash
  );
  const hrUserId = await insertUser(client, "hr@e2e.test", "hr", passwordHash);
  const adminUserId = await insertUser(
    client,
    "admin@e2e.test",
    "admin",
    passwordHash
  );
  const employeeUserId = await insertUser(
    client,
    "employee@e2e.test",
    "employee",
    passwordHash
  );
  const reportUserId = await insertUser(
    client,
    "report@e2e.test",
    "employee",
    passwordHash
  );
  const offManagerUserId = await insertUser(
    client,
    "offmanager@e2e.test",
    "manager",
    passwordHash
  );
  const offReportUserId = await insertUser(
    client,
    "offreport@e2e.test",
    "employee",
    passwordHash
  );
  const lateUserId = await insertUser(
    client,
    "late@e2e.test",
    "employee",
    passwordHash
  );
  const pastUserId = await insertUser(
    client,
    "past@e2e.test",
    "employee",
    passwordHash
  );
  const rejectUserId = await insertUser(
    client,
    "reject@e2e.test",
    "employee",
    passwordHash
  );
  const halfUserId = await insertUser(
    client,
    "half@e2e.test",
    "employee",
    passwordHash
  );
  const weekendUserId = await insertUser(
    client,
    "weekend@e2e.test",
    "employee",
    passwordHash
  );
  const dashboardUserId = await insertUser(
    client,
    "dashboard@e2e.test",
    "employee",
    passwordHash
  );
  const profileUserId = await insertUser(
    client,
    "profile@e2e.test",
    "employee",
    passwordHash
  );
  const piiUserId = await insertUser(
    client,
    "pii@e2e.test",
    "employee",
    passwordHash
  );

  const managerId = await insertEmployee(client, {
    employeeNo: "MGR-1000",
    firstName: "Manager",
    lastName: "One",
    userId: managerUserId,
    managerId: null,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "HR-1000",
    firstName: "HR",
    lastName: "One",
    userId: hrUserId,
    managerId: null,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "ADM-1000",
    firstName: "Admin",
    lastName: "Employee",
    userId: adminUserId,
    managerId: null,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "EMP-1000",
    firstName: "Employee",
    lastName: "One",
    userId: employeeUserId,
    managerId,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "REP-1000",
    firstName: "Report",
    lastName: "One",
    userId: reportUserId,
    managerId,
    departmentId,
    positionId,
  });

  const offManagerId = await insertEmployee(client, {
    employeeNo: "OFF-MGR-1000",
    firstName: "Offboard",
    lastName: "Manager",
    userId: offManagerUserId,
    managerId: null,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "OFF-REP-1000",
    firstName: "Offboard",
    lastName: "Report",
    userId: offReportUserId,
    managerId: offManagerId,
    departmentId,
    positionId,
  });

  const lateId = await insertEmployee(client, {
    employeeNo: "LATE-1000",
    firstName: "Late",
    lastName: "Employee",
    userId: lateUserId,
    managerId,
    departmentId,
    positionId,
  });

  const pastId = await insertEmployee(client, {
    employeeNo: "PAST-1000",
    firstName: "Past",
    lastName: "Employee",
    userId: pastUserId,
    managerId,
    departmentId,
    positionId,
  });

  const rejectId = await insertEmployee(client, {
    employeeNo: "REJ-1000",
    firstName: "Reject",
    lastName: "Employee",
    userId: rejectUserId,
    managerId,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "HALF-1000",
    firstName: "Half",
    lastName: "Employee",
    userId: halfUserId,
    managerId,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "WEEK-1000",
    firstName: "Weekend",
    lastName: "Employee",
    userId: weekendUserId,
    managerId,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "PII-1000",
    firstName: "PII",
    lastName: "Employee",
    userId: piiUserId,
    managerId,
    departmentId,
    positionId,
    phone: "09170000000",
    address: "42 Secret Lane",
  });

  const dashboardPendingId = await insertEmployee(client, {
    employeeNo: "DASH-1000",
    firstName: "Dashboard",
    lastName: "Pending",
    userId: dashboardUserId,
    managerId,
    departmentId,
    positionId,
  });

  await insertEmployee(client, {
    employeeNo: "PROF-1000",
    firstName: "Profile",
    lastName: "Employee",
    userId: profileUserId,
    managerId,
    departmentId,
    positionId,
  });

  const { rows: leaveTypeRows } = await client.query<{
    id: string;
    name: string;
  }>("SELECT id, name FROM leave_type");
  const leaveType = (name: string) =>
    leaveTypeRows.find((row) => row.name === name)!.id;

  await client.query(
    "ALTER TABLE leave_request DISABLE TRIGGER leave_request_no_past_dates"
  );

  await client.query(
    `INSERT INTO leave_request
       (employee_id, leave_type_id, start_date, end_date, days, reason, status)
     VALUES
       ($1, $2, CURRENT_DATE - 10, CURRENT_DATE - 10, 1, 'Past approved fixture', 'approved'),
       ($3, $2, CURRENT_DATE - 1, CURRENT_DATE - 1, 1, 'Late approval fixture', 'pending'),
       ($4, $2, CURRENT_DATE + 20, CURRENT_DATE + 20, 1, 'Future approved fixture', 'approved'),
       ($5, $6, CURRENT_DATE + 5, CURRENT_DATE + 5, 1, 'Reject remark fixture', 'pending')`,
    [
      pastId,
      leaveType("Vacation"),
      lateId,
      offManagerId,
      rejectId,
      leaveType("Sick"),
    ]
  );

  await client.query(
    `INSERT INTO leave_request
       (employee_id, leave_type_id, start_date, end_date, days, reason, status)
     VALUES ($1, $2, CURRENT_DATE + 7, CURRENT_DATE + 7, 1, 'Dashboard pending fixture', 'pending')`,
    [dashboardPendingId, leaveType("Vacation")]
  );

  await client.query(
    "ALTER TABLE leave_request ENABLE TRIGGER leave_request_no_past_dates"
  );

  await client.query(
    `INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
     SELECT e.id, lt.id, EXTRACT(YEAR FROM CURRENT_DATE)::int, lt.default_days
     FROM employee e
     CROSS JOIN leave_type lt
     ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`
  );

  await client.query(
    `INSERT INTO leave_balance (employee_id, leave_type_id, year, allocated)
     SELECT lr.employee_id,
            lr.leave_type_id,
            EXTRACT(YEAR FROM lr.start_date)::int,
            lt.default_days
     FROM leave_request lr
     JOIN leave_type lt ON lt.id = lr.leave_type_id
     ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING`
  );

  await client.query(
    `UPDATE leave_balance lb
     SET used = COALESCE((
       SELECT sum(lr.days)
       FROM leave_request lr
       WHERE lr.employee_id = lb.employee_id
         AND lr.leave_type_id = lb.leave_type_id
         AND lr.status = 'approved'
         AND EXTRACT(YEAR FROM lr.start_date)::int = lb.year
     ), 0)`
  );
}

export default async function globalSetup() {
  const admin = new Client({ connectionString: adminDatabaseUrl });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  await admin.end();

  const client = new Client({ connectionString: testDatabaseUrl });
  await client.connect();

  try {
    const root = process.cwd();
    await runSqlFile(client, path.join(root, "db", "schema.sql"));
    await runSqlFile(client, path.join(root, "db", "seed.sql"));

    const migrationsDir = path.join(root, "db", "migrations");
    const migrations = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const migration of migrations) {
      await runSqlFile(client, path.join(migrationsDir, migration));
    }

    await seedFixtures(client);
  } finally {
    await client.end();
  }
}
