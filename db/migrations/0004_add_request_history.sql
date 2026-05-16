CREATE TABLE "request_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_name" text NOT NULL,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"note" text,
	"from_status" "request_status",
	"to_status" "request_status",
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_request_id_inventory_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."inventory_requests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "request_history_request_id_idx" ON "request_history" USING btree ("request_id");
--> statement-breakpoint
INSERT INTO "request_history" (
	"request_id",
	"actor_name",
	"actor_role",
	"action",
	"note",
	"from_status",
	"to_status",
	"metadata",
	"created_at"
)
SELECT
	"request_id",
	"actor_name",
	CASE
		WHEN "actor_name" = 'System' THEN 'System'
		WHEN "action" = 'request_created' THEN 'Employee'
		ELSE 'Admin'
	END,
	"action",
	"metadata"->>'comment',
	"from_status",
	"to_status",
	"metadata",
	"created_at"
FROM "audit_logs"
WHERE "request_id" IS NOT NULL;
