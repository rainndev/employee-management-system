"use server";

import { refresh } from "next/cache";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { isRole } from "@/lib/roles";
import { PasswordSchema, type ResetPasswordState } from "@/lib/definitions";

const BCRYPT_ROUNDS = 10;

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

export async function resetUserPassword(
  _state: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const parsed = PasswordSchema.safeParse(formData.get("password"));

  if (!parsed.success) {
    return {
      errors: {
        password: parsed.error.issues.map((issue) => issue.message),
      },
    };
  }

  if (!userId || userId === admin.id) {
    return { message: "Use your own account to change your password." };
  }

  const passwordHash = await bcrypt.hash(parsed.data, BCRYPT_ROUNDS);
  await pool.query('UPDATE "user" SET password_hash = $1 WHERE id = $2', [
    passwordHash,
    userId,
  ]);

  // No refresh() here: nothing rendered in the table changes on a password
  // reset, so there is no visible data to re-fetch.
  return { success: true };
}
