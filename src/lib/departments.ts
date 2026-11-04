import "server-only";

import { pool, withTransaction } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

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
  description: string | null,
  actorUserId: string | null
) {
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO department (name, description) VALUES ($1, $2) RETURNING id",
    [name, description]
  );

  const id = rows[0].id;

  await recordAudit(pool, {
    actorUserId,
    action: "department.create",
    entity: "department",
    entityId: id,
    details: { name },
  });

  return id;
}

export async function updateDepartment(
  id: string,
  name: string,
  description: string | null,
  actorUserId: string | null
) {
  const { rowCount } = await pool.query(
    `UPDATE department
     SET name = $1, description = $2
     WHERE id = $3 AND deleted_at IS NULL`,
    [name, description, id]
  );

  if (rowCount) {
    await recordAudit(pool, {
      actorUserId,
      action: "department.update",
      entity: "department",
      entityId: id,
      details: { name },
    });
  }

  return Boolean(rowCount);
}

export async function softDeleteDepartment(
  id: string,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `UPDATE department
       SET deleted_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (!rows[0]) {
      return { deleted: false, unassigned: 0 };
    }

    const { rowCount } = await client.query(
      `UPDATE employee
       SET department_id = NULL
       WHERE department_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    await recordAudit(client, {
      actorUserId,
      action: "department.delete",
      entity: "department",
      entityId: id,
      details: { unassignedEmployees: rowCount ?? 0 },
    });

    return { deleted: true, unassigned: rowCount ?? 0 };
  });
}
