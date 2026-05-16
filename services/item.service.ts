import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  users,
} from "@/db/schema";
import { DomainError } from "@/lib/errors";
import {
  availableQuantity,
  calculateStockKpis,
  stockRiskRank,
  stockStatusFromQuantities,
} from "@/lib/inventory";
import { createItemSchema } from "@/lib/validations";
import { createAuditLog } from "./audit.service";

export async function listItems(filters: {
  category?: string;
  lowStock?: boolean;
}) {
  const conditions = [];
  if (filters.category) {
    conditions.push(eq(inventoryItems.category, filters.category));
  }
  if (filters.lowStock) {
    conditions.push(
      lte(
        sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
        inventoryItems.reorderPoint,
      ),
    );
  }

  const rows = await db
    .select()
    .from(inventoryItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(inventoryItems.name);

  return rows.map((item) => {
    const available = availableQuantity(
      item.quantityOnHand,
      item.quantityReserved,
    );
    return {
      ...item,
      available,
      isLowStock:
        stockStatusFromQuantities(
          item.quantityOnHand,
          item.quantityReserved,
          item.reorderPoint,
        ) !== "In Stock",
    };
  });
}

export async function getStockOverviewData() {
  const items = await listItems({});
  const itemIds = items.map((item) => item.id);

  const [pendingDemandRows, relatedRequestRows, recentActivityRows] =
    await Promise.all([
      db
        .select({
          itemId: inventoryRequestItems.itemId,
          pendingDemand: sql<number>`coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
          ), 0)::int`,
        })
        .from(inventoryRequestItems)
        .innerJoin(
          inventoryRequests,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .where(inArray(inventoryRequestItems.itemId, itemIds))
        .groupBy(inventoryRequestItems.itemId),
      db
        .select({
          itemId: inventoryRequestItems.itemId,
          requestId: inventoryRequests.id,
          requestCode: inventoryRequests.requestCode,
          requesterName: users.name,
          status: inventoryRequests.status,
          quantityRequested: inventoryRequestItems.quantityRequested,
          unit: inventoryRequestItems.unit,
          requiredBy: inventoryRequests.requiredBy,
        })
        .from(inventoryRequestItems)
        .innerJoin(
          inventoryRequests,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
        .where(
          and(
            inArray(inventoryRequestItems.itemId, itemIds),
            inArray(inventoryRequests.status, ["pending", "approved"]),
          ),
        )
        .orderBy(desc(inventoryRequests.createdAt)),
      db
        .select({
          itemId: inventoryRequestItems.itemId,
          id: auditLogs.id,
          action: auditLogs.action,
          actorName: auditLogs.actorName,
          requestCode: inventoryRequests.requestCode,
          createdAt: auditLogs.createdAt,
        })
        .from(inventoryRequestItems)
        .innerJoin(
          inventoryRequests,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .innerJoin(auditLogs, eq(auditLogs.requestId, inventoryRequests.id))
        .where(inArray(inventoryRequestItems.itemId, itemIds))
        .orderBy(desc(auditLogs.createdAt)),
    ]);

  const demandByItem = new Map(
    pendingDemandRows.map((row) => [row.itemId, row.pendingDemand]),
  );
  const relatedByItem = new Map<
    string,
    Array<{
      requestId: string;
      requestCode: string;
      requesterName: string;
      status: "pending" | "approved" | "rejected" | "fulfilled";
      quantityRequested: number;
      unit: string;
      requiredBy: string;
    }>
  >();
  for (const row of relatedRequestRows) {
    const current = relatedByItem.get(row.itemId) ?? [];
    if (current.length < 5) {
      current.push({
        requestId: row.requestId,
        requestCode: row.requestCode,
        requesterName: row.requesterName,
        status: row.status,
        quantityRequested: row.quantityRequested,
        unit: row.unit,
        requiredBy: row.requiredBy.toISOString(),
      });
    }
    relatedByItem.set(row.itemId, current);
  }

  const activityByItem = new Map<
    string,
    Array<{
      id: string;
      action: string;
      actorName: string;
      requestCode: string;
      createdAt: string;
    }>
  >();
  for (const row of recentActivityRows) {
    const current = activityByItem.get(row.itemId) ?? [];
    if (current.length < 5) {
      current.push({
        id: row.id,
        action: row.action,
        actorName: row.actorName,
        requestCode: row.requestCode,
        createdAt: row.createdAt.toISOString(),
      });
    }
    activityByItem.set(row.itemId, current);
  }

  const hydratedItems = items
    .map((item) => {
      const status = stockStatusFromQuantities(
        item.quantityOnHand,
        item.quantityReserved,
        item.reorderPoint,
      );
      return {
        ...item,
        status,
        pendingDemand: demandByItem.get(item.id) ?? 0,
        relatedRequests: relatedByItem.get(item.id) ?? [],
        recentActivity: activityByItem.get(item.id) ?? [],
      };
    })
    .sort(
      (left, right) =>
        stockRiskRank(left.status) - stockRiskRank(right.status) ||
        left.available - right.available ||
        left.name.localeCompare(right.name),
    );

  return {
    items: hydratedItems,
    kpis: calculateStockKpis(hydratedItems),
    categories: Array.from(new Set(hydratedItems.map((item) => item.category))),
    warehouses: Array.from(
      new Set(hydratedItems.map((item) => item.warehouse)),
    ),
  };
}

export async function createItem(input: unknown, actorName: string) {
  const parsed = createItemSchema.parse(input);

  try {
    const [item] = await db.insert(inventoryItems).values(parsed).returning();
    await createAuditLog(db, {
      itemId: item.id,
      actorName,
      action: "inventory_item_created",
    });
    return item;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("inventory_items_sku_unique")
    ) {
      throw new DomainError("An item with this SKU already exists.");
    }
    throw error;
  }
}
