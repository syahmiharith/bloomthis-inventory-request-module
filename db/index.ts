import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

loadLocalEnv();

const connectionString =
  process.env.NODE_ENV === "test"
    ? (process.env.TEST_DATABASE_URL ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "postgres://postgres:postgres@localhost:5432/inventory_request_module_test")
    : (process.env.DATABASE_URL ?? process.env.POSTGRES_URL);

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL is required for server-side database access.",
  );
}

if (
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  /(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(connectionString)
) {
  throw new Error(
    "Production database URL must point to a hosted PostgreSQL database.",
  );
}

const client = postgres(connectionString, {
  connection: {
    statement_timeout: 10_000,
    lock_timeout: 5_000,
    idle_in_transaction_session_timeout: 10_000,
  },
  connect_timeout: 10,
  idle_timeout: 20,
  max: 4,
  prepare: false,
});

export const db = drizzle(client, { schema });
export type DbClient = typeof db;

export async function closeDb() {
  await client.end();
}

function loadLocalEnv() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return;
  }

  const dbDir = dirname(fileURLToPath(import.meta.url));
  const rootDir = dirname(dbDir);
  const envLocalPath = join(rootDir, ".env.local");
  const envPath = join(rootDir, ".env");
  const resolvedEnvPath = existsSync(envLocalPath)
    ? envLocalPath
    : existsSync(envPath)
      ? envPath
      : null;

  if (!resolvedEnvPath) {
    return;
  }

  for (const line of readFileSync(resolvedEnvPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (
      key !== "DATABASE_URL" &&
      key !== "POSTGRES_URL" &&
      key !== "TEST_DATABASE_URL"
    ) {
      continue;
    }

    process.env[key] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}
