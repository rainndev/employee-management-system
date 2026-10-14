"use server";

import { pool } from "@/lib/db";
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from "@/lib/definitions";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";

const DEFAULT_ROLE = "employee";
const BCRYPT_ROUNDS = 10;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = SignupFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let userId: string;
  try {
    const { rows } = await pool.query<{ id: string }>(
      'INSERT INTO "user" (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, DEFAULT_ROLE]
    );
    userId = rows[0].id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ["That email is already registered."] } };
    }
    console.error("Signup failed:", error);
    return { message: "Could not create your account. Please try again." };
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;
  const { rows } = await pool.query<{
    id: string;
    password_hash: string;
    is_active: boolean;
  }>('SELECT id, password_hash, is_active FROM "user" WHERE email = $1', [
    email,
  ]);

  const user = rows[0];
  const passwordMatches =
    user && (await bcrypt.compare(password, user.password_hash));

  if (!user || !passwordMatches) {
    return { message: "Invalid email or password." };
  }

  if (!user.is_active) {
    return { message: "This account is disabled." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
