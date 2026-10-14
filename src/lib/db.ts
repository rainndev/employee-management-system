import "server-only";

import { Pool } from "pg";

const globalForPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForPool.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

// Reuse the pool across hot reloads in development so connections aren't leaked.
if (process.env.NODE_ENV !== "production") {
  globalForPool.pool = pool;
}
