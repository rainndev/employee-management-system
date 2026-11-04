import "server-only";

type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<unknown>;
};

export type AuditEntry = {
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

export async function recordAudit(db: Queryable, entry: AuditEntry) {
  // A failed statement aborts the surrounding transaction. When we are running
  // inside a transaction (a PoolClient), isolate the audit write in a savepoint
  // so an audit failure cannot roll back the business operation.
  const inTransaction =
    typeof (db as { release?: unknown }).release === "function";

  if (inTransaction) {
    await db.query("SAVEPOINT audit_log_insert");
  }

  try {
    await db.query(
      `INSERT INTO audit_log
         (actor_user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.actorUserId,
        entry.action,
        entry.entity,
        entry.entityId ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
      ]
    );

    if (inTransaction) {
      await db.query("RELEASE SAVEPOINT audit_log_insert");
    }
  } catch (error) {
    if (inTransaction) {
      try {
        await db.query("ROLLBACK TO SAVEPOINT audit_log_insert");
      } catch (rollbackError) {
        console.error("Could not roll back audit savepoint:", rollbackError);
      }
    }

    console.error("Could not write audit log entry:", error);
  }
}
