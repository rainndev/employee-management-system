import "server-only";

import * as z from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, { error: "DATABASE_URL is required." })
    .regex(/^postgres(ql)?:\/\//, {
      error: "DATABASE_URL must be a PostgreSQL connection string.",
    }),
  SESSION_SECRET: z
    .string()
    .min(32, { error: "SESSION_SECRET must be at least 32 characters." }),
  // Optional comma-separated allowlist, e.g. "example.com,corp.example.com".
  SIGNUP_ALLOWED_DOMAINS: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;

export const allowedSignupDomains = (env.SIGNUP_ALLOWED_DOMAINS ?? "")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);
