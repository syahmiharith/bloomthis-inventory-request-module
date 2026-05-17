import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

loadLocalEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
});

function getMigrationDatabaseUrl() {
  const url =
    process.env.MIGRATE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL;

  if (!url) {
    return "postgres://postgres:postgres@localhost:5432/inventory_request_module";
  }

  return url;
}

function loadLocalEnv() {
  if (
    process.env.MIGRATE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  ) {
    return;
  }

  const configDir = dirname(fileURLToPath(import.meta.url));
  const envLocalPath = join(configDir, ".env.local");
  const envPath = join(configDir, ".env");
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
    const value = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = value.replace(/^["']|["']$/g, "");
  }
}
