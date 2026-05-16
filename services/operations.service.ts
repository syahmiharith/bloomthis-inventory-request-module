import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrders, suppliers, users, warehouses } from "@/db/schema";

export async function listSuppliers() {
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      contactPerson: suppliers.contactPerson,
      email: suppliers.email,
      phone: suppliers.phone,
      status: suppliers.status,
      createdAt: suppliers.createdAt,
      lastOrderDate: sql<Date | null>`max(${purchaseOrders.orderDate})`,
      itemsSupplied: sql<number>`coalesce(sum(${purchaseOrders.totalItems}), 0)::int`,
    })
    .from(suppliers)
    .leftJoin(purchaseOrders, eq(purchaseOrders.supplierId, suppliers.id))
    .groupBy(suppliers.id)
    .orderBy(suppliers.name);

  return rows;
}

export async function listPurchaseOrders() {
  return db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      supplier: suppliers.name,
      warehouse: warehouses.name,
      createdBy: users.name,
      orderDate: purchaseOrders.orderDate,
      expectedDate: purchaseOrders.expectedDate,
      status: purchaseOrders.status,
      totalItems: purchaseOrders.totalItems,
    })
    .from(purchaseOrders)
    .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .innerJoin(warehouses, eq(purchaseOrders.warehouseId, warehouses.id))
    .innerJoin(users, eq(purchaseOrders.createdById, users.id))
    .orderBy(desc(purchaseOrders.orderDate));
}
