"use server";

import { pool } from "@/lib/db";
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from "@/lib/definitions";
import { createSession, deleteSession } from "@/lib/session";
import { allowedSignupDomains } from "@/lib/env";
import {
  getRequestIp,
  rateLimit,
  tooManyAttemptsMessage,
} from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";

const DEFAULT_ROLE = "employee";
const BCRYPT_ROUNDS = 10;

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

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
  const ip = await getRequestIp();
  const limited = rateLimit(`signup:${ip}`, 5, ONE_HOUR);

  if (!limited.ok) {
    return { message: tooManyAttemptsMessage(limited.retryAfterSeconds) };
  }

  const parsed = SignupFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;

  if (allowedSignupDomains.length > 0) {
    const domain = email.split("@")[1] ?? "";

    if (!allowedSignupDomains.includes(domain)) {
      return {
        errors: {
          email: ["Sign up with an approved company email address."],
        },
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let userId: string;
  let sessionVersion = 0;
  try {
    const { rows } = await pool.query<{ id: string; session_version: number }>(
      'INSERT INTO "user" (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, session_version',
      [email, passwordHash, DEFAULT_ROLE]
    );
    userId = rows[0].id;
    sessionVersion = rows[0].session_version;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ["That email is already registered."] } };
    }
    console.error("Signup failed:", error);
    return { message: "Could not create your account. Please try again." };
  }

  await createSession(userId, sessionVersion);
  redirect("/dashboard");
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const ip = await getRequestIp();
  const ipLimited = rateLimit(`login-ip:${ip}`, 30, FIFTEEN_MINUTES);

  if (!ipLimited.ok) {
    return { message: tooManyAttemptsMessage(ipLimited.retryAfterSeconds) };
  }

  const parsed = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;
  const emailLimited = rateLimit(`login-email:${email}`, 10, FIFTEEN_MINUTES);

  if (!emailLimited.ok) {
    return { message: tooManyAttemptsMessage(emailLimited.retryAfterSeconds) };
  }

  let user:
    | {
        id: string;
        password_hash: string;
        is_active: boolean;
        session_version: number;
      }
    | undefined;

  try {
    const { rows } = await pool.query<{
      id: string;
      password_hash: string;
      is_active: boolean;
      session_version: number;
    }>(
      'SELECT id, password_hash, is_active, session_version FROM "user" WHERE email = $1',
      [email]
    );

    user = rows[0];
  } catch (error) {
    console.error("Login lookup failed:", error);
    return { message: "Could not sign you in. Please try again." };
  }

  const passwordMatches =
    user && (await bcrypt.compare(password, user.password_hash));

  if (!user || !passwordMatches) {
    return { message: "Invalid email or password." };
  }

  if (!user.is_active) {
    return { message: "This account is disabled." };
  }

  await createSession(user.id, user.session_version);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
