"use server";

import { refresh } from "next/cache";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { isRole } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
import { PasswordSchema, type ResetPasswordState } from "@/lib/definitions";

const BCRYPT_ROUNDS = 10;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminActionResult = {
  success: boolean;
  message?: string;
};

export async function setUserRole(
  userId: string,
  role: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  if (!userId || !UUID_RE.test(userId)) {
    return { success: false, message: "User not found." };
  }

  if (userId === admin.id) {
    return { success: false, message: "You cannot change your own role." };
  }

  if (!isRole(role)) {
    return { success: false, message: "Choose a valid role." };
  }

  let rowCount: number | null;

  try {
    ({ rowCount } = await pool.query(
      'UPDATE "user" SET role = $1 WHERE id = $2',
      [role, userId]
    ));
  } catch (error) {
    console.error("setUserRole failed:", error);
    return { success: false, message: "Could not update the role." };
  }

  if (!rowCount) {
    return { success: false, message: "User not found." };
  }

  await recordAudit(pool, {
    actorUserId: admin.id,
    action: "user.role",
    entity: "user",
    entityId: userId,
    details: { role },
  });

  refresh();
  return { success: true };
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  if (!userId || !UUID_RE.test(userId)) {
    return { success: false, message: "User not found." };
  }

  if (typeof isActive !== "boolean") {
    return { success: false, message: "Choose a valid account state." };
  }

  if (userId === admin.id) {
    return { success: false, message: "You cannot change your own account." };
  }

  let rowCount: number | null;

  try {
    ({ rowCount } = await pool.query(
      'UPDATE "user" SET is_active = $1 WHERE id = $2',
      [isActive, userId]
    ));
  } catch (error) {
    console.error("setUserActive failed:", error);
    return { success: false, message: "Could not update the account." };
  }

  if (!rowCount) {
    return { success: false, message: "User not found." };
  }

  await recordAudit(pool, {
    actorUserId: admin.id,
    action: isActive ? "user.enable" : "user.disable",
    entity: "user",
    entityId: userId,
    details: null,
  });

  refresh();
  return { success: true };
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

  if (!userId || !UUID_RE.test(userId)) {
    return { message: "User not found." };
  }

  if (userId === admin.id) {
    return { message: "Use Account → Change password to update your own." };
  }

  const passwordHash = await bcrypt.hash(parsed.data, BCRYPT_ROUNDS);
  let rowCount: number | null;

  try {
    ({ rowCount } = await pool.query(
      `UPDATE "user"
       SET password_hash = $1,
           session_version = session_version + 1
       WHERE id = $2`,
      [passwordHash, userId]
    ));
  } catch (error) {
    console.error("resetUserPassword failed:", error);
    return { message: "Could not reset the password." };
  }

  if (!rowCount) {
    return { message: "User not found." };
  }

  await recordAudit(pool, {
    actorUserId: admin.id,
    action: "user.password_reset",
    entity: "user",
    entityId: userId,
    details: null,
  });

  return { success: true };
}
