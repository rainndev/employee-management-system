import { readFileSync } from "node:fs";
import path from "node:path";

export const TEST_DB_NAME = "employee_management_system_e2e";
export const TEST_PORT = 3200;
export const TEST_SESSION_SECRET =
  "e2e-session-secret-at-least-32-characters-long";

function loadEnvLocal() {
  const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const values: Record<string, string> = {};

  for (const line of file.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }

  return values;
}

const localEnv = loadEnvLocal();

if (!localEnv.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const databaseUrl = new URL(localEnv.DATABASE_URL);

export const adminDatabaseUrl = (() => {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
})();

export const testDatabaseUrl = (() => {
  const url = new URL(databaseUrl);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
})();

export const testBaseUrl = `http://127.0.0.1:${TEST_PORT}`;
