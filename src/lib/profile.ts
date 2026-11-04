import "server-only";

import bcrypt from "bcryptjs";
import { pool, withTransaction } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

export type MyProfile = {
  userId: string;
  email: string;
  role: string;
  employee: {
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
    department: string | null;
    position: string | null;
    managerName: string | null;
  } | null;
};

export type ProfileEmployeeInput = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  birthdate: string | null;
  gender: string | null;
};

export class ProfilePasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfilePasswordError";
  }
}

export class ProfileBirthdateError extends Error {
  constructor() {
    super("Birthdate must be on or before the hire date.");
    this.name = "ProfileBirthdateError";
  }
}

export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const { rows } = await pool.query<{
    user_id: string;
    email: string;
    role: string;
    employee_id: string | null;
    employee_no: string | null;
    first_name: string | null;
    last_name: string | null;
    birthdate: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
    hire_date: string | null;
    status: string | null;
    department: string | null;
    position: string | null;
    manager_name: string | null;
  }>(
    `SELECT u.id AS user_id,
            u.email,
            u.role,
            e.id::text AS employee_id,
            e.employee_no,
            e.first_name,
            e.last_name,
            coalesce(to_char(e.birthdate, 'YYYY-MM-DD'), '') AS birthdate,
            coalesce(e.gender, '') AS gender,
            coalesce(e.phone, '') AS phone,
            coalesce(e.address, '') AS address,
            coalesce(to_char(e.hire_date, 'YYYY-MM-DD'), '') AS hire_date,
            e.status,
            d.name AS department,
            p.title AS position,
            m.first_name || ' ' || m.last_name AS manager_name
     FROM "user" u
     LEFT JOIN employee e ON e.user_id = u.id AND e.deleted_at IS NULL
     LEFT JOIN department d ON d.id = e.department_id
     LEFT JOIN position p ON p.id = e.position_id
     LEFT JOIN employee m ON m.id = e.manager_id
     WHERE u.id = $1`,
    [userId]
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    employee:
      row.employee_id && row.employee_no && row.first_name && row.last_name
        ? {
            id: row.employee_id,
            employeeNo: row.employee_no,
            firstName: row.first_name,
            lastName: row.last_name,
            birthdate: row.birthdate ?? "",
            gender: row.gender ?? "",
            phone: row.phone ?? "",
            address: row.address ?? "",
            hireDate: row.hire_date ?? "",
            status: row.status ?? "active",
            department: row.department,
            position: row.position,
            managerName: row.manager_name,
          }
        : null,
  };
}

export async function updateMyProfile(
  userId: string,
  input: {
    email: string;
    currentPassword: string;
    employee: ProfileEmployeeInput | null;
  }
) {
  return withTransaction(async (client) => {
    const { rows: userRows } = await client.query<{
      email: string;
      password_hash: string;
    }>('SELECT email, password_hash FROM "user" WHERE id = $1 FOR UPDATE', [
      userId,
    ]);

    const user = userRows[0];

    if (!user) {
      throw new Error("User not found.");
    }

    const emailChanged = user.email !== input.email;

    if (emailChanged) {
      if (!input.currentPassword) {
        throw new ProfilePasswordError(
          "Enter your current password to change your email."
        );
      }

      const matches = await bcrypt.compare(
        input.currentPassword,
        user.password_hash
      );

      if (!matches) {
        throw new ProfilePasswordError("That password is incorrect.");
      }

      await client.query('UPDATE "user" SET email = $1 WHERE id = $2', [
        input.email,
        userId,
      ]);
    }

    let employeeUpdated = false;

    if (input.employee) {
      const { rows: employeeRows } = await client.query<{
        id: string;
        hire_date: string | null;
      }>(
        `SELECT id, to_char(hire_date, 'YYYY-MM-DD') AS hire_date
         FROM employee
         WHERE user_id = $1 AND deleted_at IS NULL
         FOR UPDATE`,
        [userId]
      );

      const employee = employeeRows[0];

      if (!employee) {
        throw new Error("Employee record not found.");
      }

      if (
        input.employee.birthdate &&
        employee.hire_date &&
        input.employee.birthdate > employee.hire_date
      ) {
        throw new ProfileBirthdateError();
      }

      await client.query(
        `UPDATE employee
         SET first_name = $1,
             last_name = $2,
             phone = $3,
             address = $4,
             birthdate = $5,
             gender = $6
         WHERE id = $7`,
        [
          input.employee.firstName,
          input.employee.lastName,
          input.employee.phone || null,
          input.employee.address || null,
          input.employee.birthdate || null,
          input.employee.gender || null,
          employee.id,
        ]
      );

      employeeUpdated = true;
    }

    await recordAudit(client, {
      actorUserId: userId,
      action: "profile.update",
      entity: "user",
      entityId: userId,
      details: { emailChanged, employeeUpdated },
    });
  });
}
