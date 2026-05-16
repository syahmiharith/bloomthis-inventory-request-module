CREATE TYPE "public"."request_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "warehouse" text DEFAULT 'Main Warehouse' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "unit" text DEFAULT 'Each' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "quantity_on_hand" integer;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "quantity_reserved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "reorder_point" integer;--> statement-breakpoint
UPDATE "inventory_items"
SET
  "quantity_on_hand" = "quantity_available",
  "reorder_point" = "low_stock_threshold"
WHERE "quantity_on_hand" IS NULL OR "reorder_point" IS NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "quantity_on_hand" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "reorder_point" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "reorder_point" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "quantity_available" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_quantity_on_hand_non_negative" CHECK ("inventory_items"."quantity_on_hand" >= 0);--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_quantity_reserved_non_negative" CHECK ("inventory_items"."quantity_reserved" >= 0);--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_quantity_reserved_within_on_hand" CHECK ("inventory_items"."quantity_reserved" <= "inventory_items"."quantity_on_hand");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_reorder_point_non_negative" CHECK ("inventory_items"."reorder_point" >= 0);--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "requester_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "request_code" text;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "department" text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "warehouse" text DEFAULT 'Main Warehouse' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "required_by" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "priority" "request_priority" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "approver_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD COLUMN "admin_comment" text;--> statement-breakpoint
UPDATE "inventory_requests" request
SET
  "requester_id" = "users"."id",
  "request_code" = CONCAT('REQ-', LEFT(request."id"::text, 8))
FROM "users"
WHERE request."requester_name" = "users"."name"
AND request."requester_id" IS NULL;--> statement-breakpoint
UPDATE "inventory_requests"
SET "requester_id" = (SELECT "id" FROM "users" ORDER BY "created_at" LIMIT 1)
WHERE "requester_id" IS NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ALTER COLUMN "requester_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ALTER COLUMN "request_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ALTER COLUMN "requester_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ALTER COLUMN "item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ALTER COLUMN "quantity_requested" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD CONSTRAINT "inventory_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_requests" ADD CONSTRAINT "inventory_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_requests_request_code_unique" ON "inventory_requests" USING btree ("request_code");--> statement-breakpoint
CREATE INDEX "inventory_requests_requester_id_idx" ON "inventory_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE TABLE "inventory_request_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity_requested" integer NOT NULL,
	"quantity_approved" integer,
	"unit" text NOT NULL,
	CONSTRAINT "inventory_request_items_quantity_requested_positive" CHECK ("inventory_request_items"."quantity_requested" > 0),
	CONSTRAINT "inventory_request_items_quantity_approved_non_negative" CHECK ("inventory_request_items"."quantity_approved" is null or "inventory_request_items"."quantity_approved" >= 0)
);--> statement-breakpoint
INSERT INTO "inventory_request_items" ("request_id", "item_id", "quantity_requested", "quantity_approved", "unit")
SELECT
  request."id",
  request."item_id",
  request."quantity_requested",
  CASE WHEN request."status" IN ('approved', 'fulfilled') THEN request."quantity_requested" ELSE NULL END,
  item."unit"
FROM "inventory_requests" request
JOIN "inventory_items" item ON item."id" = request."item_id";--> statement-breakpoint
ALTER TABLE "inventory_request_items" ADD CONSTRAINT "inventory_request_items_request_id_inventory_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."inventory_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_request_items" ADD CONSTRAINT "inventory_request_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_request_items_request_id_idx" ON "inventory_request_items" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "inventory_request_items_item_id_idx" ON "inventory_request_items" USING btree ("item_id");
