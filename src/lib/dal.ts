import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isRole, type Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return {
    isAuth: true as const,
    userId: session.userId,
    version: session.version,
  };
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await verifySession();
  const { rows } = await pool.query<{
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    session_version: number;
  }>(
    'SELECT id, email, role, is_active, session_version FROM "user" WHERE id = $1',
    [session.userId]
  );

  const row = rows[0];

  // A deactivated account, invalid role, or stale token (password changed
  // elsewhere) loses access immediately, without waiting for cookie expiry.
  if (
    !row ||
    !row.is_active ||
    !isRole(row.role) ||
    row.session_version !== session.version
  ) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
