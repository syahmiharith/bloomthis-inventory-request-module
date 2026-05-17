import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

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
  /(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(connectionString)
) {
  throw new Error(
    "Production database URL must point to a hosted PostgreSQL database.",
  );
}

const client = postgres(connectionString, { prepare: false, max: 4 });

export const db = drizzle(client, { schema });
export type DbClient = typeof db;

export async function closeDb() {
  await client.end();
}
