import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function resetDatabase() {
  await db.execute(sql`
    SET client_min_messages TO warning;
    CREATE TABLE IF NOT EXISTS request_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      request_id uuid NOT NULL REFERENCES inventory_requests(id),
      actor_name text NOT NULL,
      actor_role text NOT NULL,
      action text NOT NULL,
      note text,
      from_status request_status,
      to_status request_status,
      metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS request_history_request_id_idx ON request_history USING btree (request_id);
    TRUNCATE TABLE request_history, audit_logs, inventory_request_items, inventory_requests, inventory_items, purchase_orders, suppliers, warehouses, users
    RESTART IDENTITY CASCADE
  `);
}
