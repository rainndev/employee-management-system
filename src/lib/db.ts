import "server-only";

import { Pool, type PoolClient } from "pg";
import { env } from "@/lib/env";

const globalForPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForPool.pool ?? new Pool({ connectionString: env.DATABASE_URL });

// A dropped idle connection emits an 'error' event on the pool. Without a
// listener Node treats it as an unhandled EventEmitter error and can exit.
pool.on("error", (error) => {
  console.error("Unexpected database pool error:", error);
});

// Reuse the pool across hot reloads in development so connections aren't leaked.
if (process.env.NODE_ENV !== "production") {
  globalForPool.pool = pool;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
