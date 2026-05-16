import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.NODE_ENV === "test"
    ? (process.env.TEST_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/inventory_request_module_test")
    : (process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/inventory_request_module");

const client = postgres(connectionString, { prepare: false, max: 4 });

export const db = drizzle(client, { schema });
export type DbClient = typeof db;

export async function closeDb() {
  await client.end();
}
