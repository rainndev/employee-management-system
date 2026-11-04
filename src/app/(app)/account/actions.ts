"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { createSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit, tooManyAttemptsMessage } from "@/lib/rate-limit";
import {
  ChangePasswordSchema,
  type AccountPasswordState,
} from "@/lib/definitions";

const BCRYPT_ROUNDS = 10;

export async function changePassword(
  _state: AccountPasswordState,
  formData: FormData
): Promise<AccountPasswordState> {
  const user = await requireUser();
  const limited = rateLimit(`password:${user.id}`, 10, 15 * 60 * 1000);

  if (!limited.ok) {
    return {
      message: tooManyAttemptsMessage(limited.retryAfterSeconds),
    };
  }

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return {
      errors: {
        currentPassword: errors.currentPassword,
        password: errors.password,
        confirmPassword: errors.confirmPassword,
      },
    };
  }

  const { rows } = await pool.query<{
    password_hash: string;
    session_version: number;
  }>('SELECT password_hash, session_version FROM "user" WHERE id = $1', [
    user.id,
  ]);

  const row = rows[0];

  if (!row) {
    return { message: "Your account could not be loaded. Sign in again." };
  }

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    row.password_hash
  );

  if (!matches) {
    return {
      errors: { currentPassword: ["That password is incorrect."] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const { rows: updated } = await pool.query<{ session_version: number }>(
    `UPDATE "user"
     SET password_hash = $1,
         session_version = session_version + 1
     WHERE id = $2
     RETURNING session_version`,
    [passwordHash, user.id]
  );

  // Reissue this browser's cookie at the new version; every other session is
  // now stale and will be rejected by getCurrentUser().
  await createSession(user.id, updated[0].session_version);

  await recordAudit(pool, {
    actorUserId: user.id,
    action: "user.password_change",
    entity: "user",
    entityId: user.id,
    details: null,
  });

  return {
    success: true,
    message: "Password updated. Other sessions have been signed out.",
  };
}
