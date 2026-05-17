import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { cache } from "react";
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
  calculateStockKpis,
  stockRiskRank,
  stockStatusFromQuantities,
} from "@/lib/inventory";
import { createItemSchema } from "@/lib/validations";
import { createAuditLog } from "./audit.service";

type ItemStockFilter = "in" | "low" | "out";

export type ListItemsResult = Awaited<ReturnType<typeof listItemsCached>>;
export type RequestableItemRow = {
  available: number;
  category: string;
  id: string;
  name: string;
  sku: string;
};

export async function listItems(filters: {
  category?: string;
  lowStock?: boolean;
  page?: number;
  pageSize?: number;
  q?: string;
  stock?: ItemStockFilter | "";
}) {
  return withDevTiming("listItems", () =>
    listItemsCached(
      filters.category ?? "",
      filters.lowStock ?? false,
      normalizePage(filters.page),
      normalizePageSize(filters.pageSize),
      filters.q?.trim() ?? "",
      filters.stock ?? "",
    ),
  );
}

const listItemsCached = cache(async function listItemsCached(
  category: string,
  lowStock: boolean,
  page: number,
  pageSize: number,
  query: string,
  stock: ItemStockFilter | "",
) {
  const available = sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`;
  const conditions = [];
  if (category) {
    conditions.push(eq(inventoryItems.category, category));
  }
  if (query) {
    const search = `%${query}%`;
    conditions.push(
      sql`(${inventoryItems.name} ilike ${search} or ${inventoryItems.sku} ilike ${search})`,
    );
  }
  if (lowStock) {
    conditions.push(lte(available, inventoryItems.reorderPoint));
  }
  if (stock === "in") {
    conditions.push(sql`${available} > ${inventoryItems.reorderPoint}`);
  }
  if (stock === "low") {
    conditions.push(
      and(sql`${available} > 0`, lte(available, inventoryItems.reorderPoint)),
    );
  }
  if (stock === "out") {
    conditions.push(sql`${available} <= 0`);
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(inventoryItems)
    .where(whereClause);
  const totalCount = totalRow?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  const [rows, categories] = await Promise.all([
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        sku: inventoryItems.sku,
        category: inventoryItems.category,
        warehouse: inventoryItems.warehouse,
        unit: inventoryItems.unit,
        quantityOnHand: inventoryItems.quantityOnHand,
        quantityReserved: inventoryItems.quantityReserved,
        reorderPoint: inventoryItems.reorderPoint,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        available,
      })
      .from(inventoryItems)
      .where(whereClause)
      .orderBy(asc(inventoryItems.name))
      .limit(pageSize)
      .offset((safePage - 1) * pageSize),
    listItemCategories(),
  ]);

  return {
    categories,
    page: safePage,
    pageCount,
    pageSize,
    rows: rows.map((item) => ({
      ...item,
      isLowStock:
        stockStatusFromQuantities(
          item.quantityOnHand,
          item.quantityReserved,
          item.reorderPoint,
        ) !== "In Stock",
    })),
    totalCount,
  };
});

export async function listItemCategories() {
  return listItemCategoriesCached();
}

const listItemCategoriesCached = cache(async function listItemCategoriesCached() {
  const rows = await db
    .selectDistinct({ category: inventoryItems.category })
    .from(inventoryItems)
    .orderBy(asc(inventoryItems.category));

  return rows.map((row) => row.category);
});

export async function listRequestableItems({
  page,
  pageSize,
  q,
  selectedId,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  selectedId?: string;
} = {}) {
  return withDevTiming("listRequestableItems", () =>
    listRequestableItemsCached(
      normalizePage(page),
      Math.min(normalizePageSize(pageSize), 50),
      q?.trim() ?? "",
      selectedId ?? "",
    ),
  );
}

const listRequestableItemsCached = cache(async function listRequestableItemsCached(
  page: number,
  pageSize: number,
  query: string,
  selectedId: string,
) {
  const available = sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`;
  const conditions = [];
  if (query) {
    const search = `%${query}%`;
    conditions.push(
      sql`(
        ${inventoryItems.name} ilike ${search}
        or ${inventoryItems.sku} ilike ${search}
        or ${inventoryItems.category} ilike ${search}
      )`,
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(inventoryItems)
    .where(whereClause);
  const totalCount = totalRow?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
    .select(requestableItemSelection(available))
    .from(inventoryItems)
    .where(whereClause)
    .orderBy(asc(inventoryItems.name))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  if (selectedId && !rows.some((item) => item.id === selectedId)) {
    const [selectedItem] = await db
      .select(requestableItemSelection(available))
      .from(inventoryItems)
      .where(eq(inventoryItems.id, selectedId))
      .limit(1);

    if (selectedItem) {
      rows.unshift(selectedItem);
    }
  }

  return {
    page: safePage,
    pageCount,
    pageSize,
    rows,
    totalCount,
  };
});

function requestableItemSelection(
  available: ReturnType<typeof sql<number>>,
) {
  return {
    available,
    category: inventoryItems.category,
    id: inventoryItems.id,
    name: inventoryItems.name,
    sku: inventoryItems.sku,
  };
}

export async function getItemById(id: string) {
  return withDevTiming("getItemById", () => getItemByIdCached(id));
}

const getItemByIdCached = cache(async function getItemByIdCached(id: string) {
  const [item] = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      warehouse: inventoryItems.warehouse,
      unit: inventoryItems.unit,
      quantityOnHand: inventoryItems.quantityOnHand,
      quantityReserved: inventoryItems.quantityReserved,
      reorderPoint: inventoryItems.reorderPoint,
      createdAt: inventoryItems.createdAt,
      updatedAt: inventoryItems.updatedAt,
      available: sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id))
    .limit(1);

  return item
    ? {
        ...item,
        isLowStock:
          stockStatusFromQuantities(
            item.quantityOnHand,
            item.quantityReserved,
            item.reorderPoint,
          ) !== "In Stock",
      }
    : null;
});

export async function getStockOverviewData() {
  return getStockOverviewDataCached();
}

const getStockOverviewDataCached = cache(async function getStockOverviewDataCached() {
  const items = await listAllItemsForOverview();
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
});

async function listAllItemsForOverview() {
  const rows = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      warehouse: inventoryItems.warehouse,
      unit: inventoryItems.unit,
      quantityOnHand: inventoryItems.quantityOnHand,
      quantityReserved: inventoryItems.quantityReserved,
      reorderPoint: inventoryItems.reorderPoint,
      createdAt: inventoryItems.createdAt,
      updatedAt: inventoryItems.updatedAt,
      available: sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
    })
    .from(inventoryItems)
    .orderBy(asc(inventoryItems.name));

  return rows.map((item) => ({
    ...item,
    isLowStock:
      stockStatusFromQuantities(
        item.quantityOnHand,
        item.quantityReserved,
        item.reorderPoint,
      ) !== "In Stock",
  }));
}

function normalizePage(page?: number) {
  return Math.max(1, Number.isFinite(page) ? Math.floor(page ?? 1) : 1);
}

function normalizePageSize(pageSize?: number) {
  const value = Number.isFinite(pageSize)
    ? Math.floor(pageSize ?? 25)
    : 25;
  return Math.min(Math.max(value, 1), 100);
}

async function withDevTiming<T>(label: string, fn: () => Promise<T>) {
  if (process.env.NODE_ENV !== "development") {
    return fn();
  }

  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    console.info(`[db:${label}] ${Math.round(performance.now() - startedAt)}ms`);
  }
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
