import "server-only";

import { pool } from "@/lib/db";

export type Position = {
  id: string;
  title: string;
  description: string | null;
};

export async function listPositions(): Promise<Position[]> {
  const { rows } = await pool.query<Position>(
    `SELECT id, title, description
     FROM position
     WHERE deleted_at IS NULL
     ORDER BY title ASC`
  );

  return rows;
}

export async function createPosition(
  title: string,
  description: string | null
) {
  await pool.query(
    "INSERT INTO position (title, description) VALUES ($1, $2)",
    [title, description]
  );
}

export async function updatePosition(
  id: string,
  title: string,
  description: string | null
) {
  await pool.query(
    `UPDATE position
     SET title = $1, description = $2
     WHERE id = $3 AND deleted_at IS NULL`,
    [title, description, id]
  );
}

export async function softDeletePosition(id: string) {
  await pool.query(
    "UPDATE position SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
}
