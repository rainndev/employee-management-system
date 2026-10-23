#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Read DATABASE_URL from .env.local when the shell doesn't provide it.
function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, raw] = match;
    if (process.env[key] === undefined) {
      process.env[key] = raw.replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

loadEnvFile(".env.local");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

// Prefer an explicit PSQL_PATH, then the usual Windows install locations,
// then `psql` from PATH.
const candidates = [
  process.env.PSQL_PATH,
  "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
].filter(Boolean);

let psql = candidates.find((candidate) => existsSync(candidate) && candidate);

if (!psql) {
  const probe = spawnSync("psql", ["--version"], { stdio: "ignore" });
  if (!probe.error && probe.status === 0) {
    psql = "psql";
  }
}

if (!psql) {
  console.error(
    "Could not find psql. Set PSQL_PATH in .env.local or add PostgreSQL's bin folder to PATH."
  );
  process.exit(1);
}

const mode = process.argv[2];
const migrationsDir = "db/migrations";
let files;

if (mode === "schema") {
  files = ["db/schema.sql"];
} else if (mode === "migrate") {
  files = existsSync(migrationsDir)
    ? readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort()
        .map((file) => join(migrationsDir, file))
    : [];
} else {
  console.error("Usage: node scripts/db.mjs <schema|migrate>");
  process.exit(1);
}

if (files.length === 0) {
  console.log("Nothing to run.");
  process.exit(0);
}

for (const file of files) {
  console.log(`\n▶ ${file}`);

  const result = spawnSync(
    psql,
    [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", file],
    {
      stdio: "inherit",
    }
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `\n✔ ${mode === "schema" ? "Schema applied" : "Migrations applied"}.`
);
