"use server";

import { refresh } from "next/cache";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { isRole } from "@/lib/roles";
import { PasswordSchema, type ResetPasswordState } from "@/lib/definitions";

const BCRYPT_ROUNDS = 10;

export async function setUserRole(userId: string, role: string) {
  const admin = await requireAdmin();

  if (!userId || userId === admin.id || !isRole(role)) {
    return;
  }

  await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [role, userId]);
  refresh();
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin();

  if (!userId || userId === admin.id) {
    return;
  }

  await pool.query('UPDATE "user" SET is_active = $1 WHERE id = $2', [
    isActive,
    userId,
  ]);
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

  return { success: true };
}
