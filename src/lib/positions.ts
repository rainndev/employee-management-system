import "server-only";

import { pool, withTransaction } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

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
  description: string | null,
  actorUserId: string | null
) {
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO position (title, description) VALUES ($1, $2) RETURNING id",
    [title, description]
  );

  const id = rows[0].id;

  await recordAudit(pool, {
    actorUserId,
    action: "position.create",
    entity: "position",
    entityId: id,
    details: { title },
  });

  return id;
}

export async function updatePosition(
  id: string,
  title: string,
  description: string | null,
  actorUserId: string | null
) {
  const { rowCount } = await pool.query(
    `UPDATE position
     SET title = $1, description = $2
     WHERE id = $3 AND deleted_at IS NULL`,
    [title, description, id]
  );

  if (rowCount) {
    await recordAudit(pool, {
      actorUserId,
      action: "position.update",
      entity: "position",
      entityId: id,
      details: { title },
    });
  }

  return Boolean(rowCount);
}

export async function softDeletePosition(
  id: string,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `UPDATE position
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
       SET position_id = NULL
       WHERE position_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    await recordAudit(client, {
      actorUserId,
      action: "position.delete",
      entity: "position",
      entityId: id,
      details: { unassignedEmployees: rowCount ?? 0 },
    });

    return { deleted: true, unassigned: rowCount ?? 0 };
  });
}
