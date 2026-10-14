"use server";

import { refresh } from "next/cache";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { isRole } from "@/lib/roles";

export async function updateUser(formData: FormData) {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role");
  const isActive = formData.get("isActive") === "true";

  if (!userId || !isRole(role)) {
    return;
  }

  // An admin must not be able to demote or disable themselves, or they would
  // lock everyone out of this page.
  if (userId === admin.id) {
    return;
  }

  await pool.query(
    'UPDATE "user" SET role = $1, is_active = $2 WHERE id = $3',
    [role, isActive, userId]
  );

  refresh();
}
