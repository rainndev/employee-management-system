import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true as const, userId: session.userId, role: session.role };
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const { rows } = await pool.query<{
    id: string;
    email: string;
    role: string;
  }>('SELECT id, email, role FROM "user" WHERE id = $1', [session.userId]);

  return rows[0] ?? null;
});
