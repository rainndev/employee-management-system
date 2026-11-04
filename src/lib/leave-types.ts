import "server-only";

import { pool, withTransaction } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

export type AdminLeaveType = {
  id: string;
  name: string;
  defaultDays: number;
  isPaid: boolean;
  requestCount: number;
};

export type LeaveTypeInput = {
  name: string;
  defaultDays: number;
  isPaid: boolean;
};

export async function listAdminLeaveTypes(): Promise<AdminLeaveType[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    default_days: number;
    is_paid: boolean;
    request_count: number;
  }>(
    `SELECT lt.id,
            lt.name,
            lt.default_days,
            lt.is_paid,
            (SELECT count(*) FROM leave_request lr
             WHERE lr.leave_type_id = lt.id)::int AS request_count
     FROM leave_type lt
     WHERE lt.deleted_at IS NULL
     ORDER BY lower(lt.name) ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    defaultDays: row.default_days,
    isPaid: row.is_paid,
    requestCount: row.request_count,
  }));
}

export async function createLeaveType(
  input: LeaveTypeInput,
  actorUserId: string | null
) {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO leave_type (name, default_days, is_paid)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [input.name, input.defaultDays, input.isPaid]
  );

  const id = rows[0].id;

  await recordAudit(pool, {
    actorUserId,
    action: "leave_type.create",
    entity: "leave_type",
    entityId: id,
    details: input,
  });

  return id;
}

export async function updateLeaveType(
  id: string,
  input: LeaveTypeInput,
  actorUserId: string | null
) {
  return withTransaction(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE leave_type
       SET name = $1, default_days = $2, is_paid = $3
       WHERE id = $4 AND deleted_at IS NULL`,
      [input.name, input.defaultDays, input.isPaid, id]
    );

    if (!rowCount) {
      return false;
    }

    // Apply the new allocation to the current and future years. Historical
    // balances remain untouched, and used days are always preserved.
    await client.query(
      `UPDATE leave_balance
       SET allocated = GREATEST($1::numeric, used)
       WHERE leave_type_id = $2
         AND year >= EXTRACT(YEAR FROM CURRENT_DATE)::int`,
      [input.defaultDays, id]
    );

    await recordAudit(client, {
      actorUserId,
      action: "leave_type.update",
      entity: "leave_type",
      entityId: id,
      details: input,
    });

    return true;
  });
}

export async function softDeleteLeaveType(
  id: string,
  actorUserId: string | null
) {
  const { rows } = await pool.query<{ id: string }>(
    `UPDATE leave_type
     SET deleted_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );

  if (!rows[0]) {
    return false;
  }

  await recordAudit(pool, {
    actorUserId,
    action: "leave_type.delete",
    entity: "leave_type",
    entityId: id,
    details: null,
  });

  return true;
}
