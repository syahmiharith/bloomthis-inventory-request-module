import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems, warehouses } from "@/db/schema";

export async function listWarehouses() {
  return db.select().from(warehouses).orderBy(asc(warehouses.name));
}

export async function listWarehouseSummaries() {
  return db
    .select({
      id: warehouses.id,
      name: warehouses.name,
      totalItems: sql<number>`count(${inventoryItems.id})::int`,
      lowStockItems: sql<number>`count(*) filter (
        where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} <= ${inventoryItems.reorderPoint}
      )::int`,
      outOfStockItems: sql<number>`count(*) filter (
        where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} <= 0
      )::int`,
    })
    .from(warehouses)
    .leftJoin(inventoryItems, eq(inventoryItems.warehouse, warehouses.name))
    .groupBy(warehouses.id)
    .orderBy(asc(warehouses.name));
}
