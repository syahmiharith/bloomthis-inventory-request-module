import { existsSync, readFileSync } from "node:fs";
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
    throw new Error(
      "MIGRATE_DATABASE_URL, DATABASE_URL, POSTGRES_URL_NON_POOLING, or POSTGRES_URL is required for Drizzle migrations.",
    );
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

  const envPath = existsSync(".env.local")
    ? ".env.local"
    : existsSync(".env")
      ? ".env"
      : null;

  if (!envPath) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
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
