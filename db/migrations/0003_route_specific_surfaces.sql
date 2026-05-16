ALTER TABLE "users" ADD COLUMN "department" text DEFAULT 'Operations' NOT NULL;
CREATE TABLE "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "contact_person" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "suppliers_email_unique" ON "suppliers" USING btree ("email");
CREATE TABLE "purchase_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "po_number" text NOT NULL,
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
  "warehouse_id" uuid NOT NULL REFERENCES "warehouses"("id"),
  "created_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "order_date" timestamp with time zone NOT NULL,
  "expected_date" timestamp with time zone NOT NULL,
  "status" text NOT NULL,
  "total_items" integer NOT NULL
);
