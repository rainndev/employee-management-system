import "server-only";

import { pool } from "@/lib/db";

export type Department = {
  id: string;
  name: string;
  description: string | null;
};

export async function listDepartments(): Promise<Department[]> {
  const { rows } = await pool.query<Department>(
    `SELECT id, name, description
     FROM department
     WHERE deleted_at IS NULL
     ORDER BY name ASC`
  );

  return rows;
}

export async function createDepartment(
  name: string,
  description: string | null
) {
  await pool.query(
    "INSERT INTO department (name, description) VALUES ($1, $2)",
    [name, description]
  );
}

export async function updateDepartment(
  id: string,
  name: string,
  description: string | null
) {
  await pool.query(
    `UPDATE department
     SET name = $1, description = $2
     WHERE id = $3 AND deleted_at IS NULL`,
    [name, description, id]
  );
}

export async function softDeleteDepartment(id: string) {
  await pool.query(
    "UPDATE department SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
}
