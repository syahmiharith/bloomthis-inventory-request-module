import { existsSync, readFileSync } from "node:fs";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.log("DATABASE_URL_STATUS=missing");
} else if (/(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(databaseUrl)) {
  console.log("DATABASE_URL_STATUS=localhost");
} else {
  console.log("DATABASE_URL_STATUS=hosted");
}

function loadLocalEnv() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
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
    if (key !== "DATABASE_URL" && key !== "POSTGRES_URL") {
      continue;
    }

    process.env[key] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}
