import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["employee", "admin"]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
]);
export const requestPriorityEnum = pgEnum("request_priority", [
  "low",
  "normal",
  "high",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(),
  department: text("department").default("Operations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("warehouses_name_unique").on(table.name),
  }),
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    status: text("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("suppliers_email_unique").on(table.email),
  }),
);

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: text("po_number").notNull(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  orderDate: timestamp("order_date", { withTimezone: true }).notNull(),
  expectedDate: timestamp("expected_date", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  totalItems: integer("total_items").notNull(),
});

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    category: text("category").notNull(),
    warehouse: text("warehouse").default("Main Warehouse").notNull(),
    unit: text("unit").default("Each").notNull(),
    quantityOnHand: integer("quantity_on_hand").notNull(),
    quantityReserved: integer("quantity_reserved").default(0).notNull(),
    reorderPoint: integer("reorder_point").default(5).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    skuUnique: uniqueIndex("inventory_items_sku_unique").on(table.sku),
    categoryIdx: index("inventory_items_category_idx").on(table.category),
    onHandNonNegative: check(
      "inventory_items_quantity_on_hand_non_negative",
      sql`${table.quantityOnHand} >= 0`,
    ),
    reservedNonNegative: check(
      "inventory_items_quantity_reserved_non_negative",
      sql`${table.quantityReserved} >= 0`,
    ),
    reservedWithinOnHand: check(
      "inventory_items_quantity_reserved_within_on_hand",
      sql`${table.quantityReserved} <= ${table.quantityOnHand}`,
    ),
    reorderPointNonNegative: check(
      "inventory_items_reorder_point_non_negative",
      sql`${table.reorderPoint} >= 0`,
    ),
  }),
);

export const inventoryRequests = pgTable(
  "inventory_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id),
    requestCode: text("request_code").notNull(),
    department: text("department").notNull(),
    warehouse: text("warehouse").notNull(),
    requiredBy: timestamp("required_by", { withTimezone: true }).notNull(),
    priority: requestPriorityEnum("priority").default("normal").notNull(),
    reason: text("reason").notNull(),
    status: requestStatusEnum("status").default("pending").notNull(),
    approverId: uuid("approver_id").references(() => users.id),
    adminComment: text("admin_comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("inventory_requests_status_idx").on(table.status),
    requesterIdx: index("inventory_requests_requester_id_idx").on(
      table.requesterId,
    ),
    requestCodeUnique: uniqueIndex("inventory_requests_request_code_unique").on(
      table.requestCode,
    ),
  }),
);

export const inventoryRequestItems = pgTable(
  "inventory_request_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => inventoryRequests.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => inventoryItems.id),
    quantityRequested: integer("quantity_requested").notNull(),
    quantityApproved: integer("quantity_approved"),
    unit: text("unit").notNull(),
  },
  (table) => ({
    requestIdx: index("inventory_request_items_request_id_idx").on(
      table.requestId,
    ),
    itemIdx: index("inventory_request_items_item_id_idx").on(table.itemId),
    quantityRequestedPositive: check(
      "inventory_request_items_quantity_requested_positive",
      sql`${table.quantityRequested} > 0`,
    ),
    quantityApprovedNonNegative: check(
      "inventory_request_items_quantity_approved_non_negative",
      sql`${table.quantityApproved} is null or ${table.quantityApproved} >= 0`,
    ),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id").references(() => inventoryRequests.id),
    itemId: uuid("item_id").references(() => inventoryItems.id),
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    fromStatus: requestStatusEnum("from_status"),
    toStatus: requestStatusEnum("to_status"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdx: index("audit_logs_request_id_idx").on(table.requestId),
  }),
);

export const requestHistory = pgTable(
  "request_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => inventoryRequests.id),
    actorName: text("actor_name").notNull(),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    note: text("note"),
    fromStatus: requestStatusEnum("from_status"),
    toStatus: requestStatusEnum("to_status"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdx: index("request_history_request_id_idx").on(table.requestId),
  }),
);

export type User = typeof users.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryRequest = typeof inventoryRequests.$inferSelect;
export type InventoryRequestItem = typeof inventoryRequestItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type RequestHistory = typeof requestHistory.$inferSelect;
