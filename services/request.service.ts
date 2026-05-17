import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  requestHistory,
  users,
  type InventoryRequest,
  type User,
} from "@/db/schema";
import type { RequestStatus } from "@/lib/constants";
import { DomainError, NotFoundError } from "@/lib/errors";
import { assertValidRequestTransition } from "@/lib/utils";
import {
  createRequestSchema,
  updateRequestStatusSchema,
} from "@/lib/validations";
import { createAuditLog } from "./audit.service";

export async function listRequests(
  filters: {
    category?: string;
    page?: number;
    pageSize?: number;
    q?: string;
    status?: RequestStatus;
  },
  viewer?: User,
) {
  return withDevTiming("listRequests", () =>
    listRequestsCached(
      filters.status ?? "",
      viewer?.id ?? "",
      viewer?.role ?? "",
      filters.category?.trim() ?? "",
      normalizePage(filters.page),
      normalizePageSize(filters.pageSize),
      filters.q?.trim() ?? "",
    ),
  );
}

const listRequestsCached = cache(async function listRequestsCached(
  status: RequestStatus | "",
  viewerId: string,
  viewerRole: User["role"] | "",
  category: string,
  page: number,
  pageSize: number,
  query: string,
) {
  const conditions = [];
  if (status) {
    conditions.push(eq(inventoryRequests.status, status));
  }
  if (viewerRole === "employee") {
    conditions.push(eq(inventoryRequests.requesterId, viewerId));
  }
  if (category) {
    conditions.push(
      sql`exists (
        select 1
        from inventory_request_items request_item_filter
        inner join inventory_items item_filter
          on item_filter.id = request_item_filter.item_id
        where request_item_filter.request_id = ${inventoryRequests.id}
          and item_filter.category = ${category}
      )`,
    );
  }
  if (query) {
    const search = `%${query}%`;
    conditions.push(
      sql`(
        ${inventoryRequests.requestCode} ilike ${search}
        or ${users.name} ilike ${search}
        or exists (
          select 1
          from inventory_request_items request_item_search
          inner join inventory_items item_search
            on item_search.id = request_item_search.item_id
          where request_item_search.request_id = ${inventoryRequests.id}
            and item_search.name ilike ${search}
        )
      )`,
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(inventoryRequests)
    .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
    .where(whereClause);
  const totalCount = totalRow?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  const requests = await db
    .select({
      id: inventoryRequests.id,
      requestCode: inventoryRequests.requestCode,
      requesterId: inventoryRequests.requesterId,
      requesterName: users.name,
      department: inventoryRequests.department,
      warehouse: inventoryRequests.warehouse,
      requiredBy: inventoryRequests.requiredBy,
      priority: inventoryRequests.priority,
      reason: inventoryRequests.reason,
      status: inventoryRequests.status,
      approverId: inventoryRequests.approverId,
      adminComment: inventoryRequests.adminComment,
      createdAt: inventoryRequests.createdAt,
    })
    .from(inventoryRequests)
    .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
    .where(whereClause)
    .orderBy(desc(inventoryRequests.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);
  const requestIds = requests.map((request) => request.id);
  const [itemRows, categories] = await Promise.all([
    requestIds.length > 0
      ? getRequestItems(requestIds)
      : Promise.resolve([]),
    listRequestCategoriesCached(viewerId, viewerRole),
  ]);
  const itemsByRequest = groupRequestItems(itemRows);

  return {
    categories,
    page: safePage,
    pageCount,
    pageSize,
    rows: requests.map((request) => ({
      ...request,
      createdAt: request.createdAt.toISOString(),
      items: itemsByRequest.get(request.id) ?? [],
    })),
    totalCount,
  };
});

export async function getRequestById(id: string, viewer?: User) {
  const request = await withDevTiming("getRequestById", () =>
    getRequestByIdCached(id, viewer?.id ?? "", viewer?.role ?? ""),
  );
  if (!request) {
    throw new NotFoundError("Request not found.");
  }
  return request;
}

const getRequestByIdCached = cache(async function getRequestByIdCached(
  id: string,
  viewerId: string,
  viewerRole: User["role"] | "",
) {
  const conditions = [eq(inventoryRequests.id, id)];
  if (viewerRole === "employee") {
    conditions.push(eq(inventoryRequests.requesterId, viewerId));
  }

  const [request] = await db
    .select({
      id: inventoryRequests.id,
      requestCode: inventoryRequests.requestCode,
      requesterId: inventoryRequests.requesterId,
      requesterName: users.name,
      department: inventoryRequests.department,
      warehouse: inventoryRequests.warehouse,
      requiredBy: inventoryRequests.requiredBy,
      priority: inventoryRequests.priority,
      reason: inventoryRequests.reason,
      status: inventoryRequests.status,
      approverId: inventoryRequests.approverId,
      adminComment: inventoryRequests.adminComment,
      createdAt: inventoryRequests.createdAt,
    })
    .from(inventoryRequests)
    .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
    .where(and(...conditions))
    .limit(1);

  if (!request) {
    return null;
  }

  return hydrateRequest(request);
});

export async function createRequest(input: unknown, actor: User) {
  const parsed = createRequestSchema.parse(input);
  const itemIds = parsed.items.map((item) => item.itemId);
  const items = await db
    .select()
    .from(inventoryItems)
    .where(inArray(inventoryItems.id, itemIds));

  if (items.length !== itemIds.length) {
    throw new NotFoundError("One or more requested items were not found.");
  }

  const requestCode = `REQ-${Date.now()}`;

  return db.transaction(async (tx) => {
    const [request] = await tx
      .insert(inventoryRequests)
      .values({
        requesterId: actor.id,
        requestCode,
        department: parsed.department,
        warehouse: parsed.warehouse,
        requiredBy: parsed.requiredBy,
        priority: parsed.priority,
        reason: parsed.reason,
      })
      .returning();

    await tx.insert(inventoryRequestItems).values(
      parsed.items.map((item) => {
        const inventoryItem = items.find((entry) => entry.id === item.itemId)!;
        return {
          requestId: request.id,
          itemId: item.itemId,
          quantityRequested: item.quantityRequested,
          unit: inventoryItem.unit,
        };
      }),
    );

    await createAuditLog(tx, {
      requestId: request.id,
      actorName: actor.name,
      actorRole: actor.role === "admin" ? "Admin" : "Employee",
      action: "request_created",
      toStatus: "pending",
    });

    return request;
  });
}

export async function updateRequestStatus(
  requestId: string,
  input: unknown,
  actorName: string,
) {
  const parsed = updateRequestStatusSchema.parse(input);
  const [request] = await db
    .select()
    .from(inventoryRequests)
    .where(eq(inventoryRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new NotFoundError("Request not found.");
  }

  assertValidRequestTransition(request.status, parsed.status);

  if (parsed.status === "approved") {
    return approveRequest(request, parsed, actorName);
  }

  if (parsed.status === "fulfilled") {
    return fulfillRequest(request, parsed, actorName);
  }

  const [updated] = await db
    .update(inventoryRequests)
    .set({
      status: "rejected",
      approverId: parsed.approverId ?? request.approverId,
      adminComment: parsed.adminComment ?? request.adminComment,
      updatedAt: new Date(),
    })
    .where(eq(inventoryRequests.id, request.id))
    .returning();

  await createAuditLog(db, {
    requestId: request.id,
    actorName,
    actorRole: "Admin",
    action: "request_rejected",
    fromStatus: request.status,
    toStatus: "rejected",
    note: parsed.adminComment ?? undefined,
    metadata: { comment: parsed.adminComment ?? null },
  });

  return updated;
}

async function approveRequest(
  request: InventoryRequest,
  parsed: ReturnType<typeof updateRequestStatusSchema.parse>,
  actorName: string,
) {
  const lines = await db
    .select()
    .from(inventoryRequestItems)
    .where(eq(inventoryRequestItems.requestId, request.id));

  return db.transaction(async (tx) => {
    for (const line of lines) {
      await tx
        .update(inventoryRequestItems)
        .set({ quantityApproved: line.quantityRequested })
        .where(eq(inventoryRequestItems.id, line.id));
    }

    const [updated] = await tx
      .update(inventoryRequests)
      .set({
        status: "approved",
        approverId: parsed.approverId ?? request.approverId,
        adminComment: parsed.adminComment ?? request.adminComment,
        updatedAt: new Date(),
      })
      .where(eq(inventoryRequests.id, request.id))
      .returning();

    await createAuditLog(tx, {
      requestId: request.id,
      actorName,
      actorRole: "Admin",
      action: "request_approved",
      fromStatus: request.status,
      toStatus: "approved",
      note: parsed.adminComment ?? undefined,
      metadata: { comment: parsed.adminComment ?? null },
    });

    return updated;
  });
}

async function fulfillRequest(
  request: InventoryRequest,
  parsed: ReturnType<typeof updateRequestStatusSchema.parse>,
  actorName: string,
) {
  const lines = await db
    .select()
    .from(inventoryRequestItems)
    .where(eq(inventoryRequestItems.requestId, request.id));

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(inventoryRequests)
      .set({
        status: "fulfilled",
        fulfilledAt: new Date(),
        adminComment: parsed.adminComment ?? request.adminComment,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryRequests.id, request.id),
          eq(inventoryRequests.status, "approved"),
        ),
      )
      .returning();

    if (!updated) {
      throw new DomainError("Only approved requests can be fulfilled.");
    }

    for (const line of lines) {
      const quantityToFulfill = line.quantityApproved ?? line.quantityRequested;
      const [stockUpdate] = await tx
        .update(inventoryItems)
        .set({
          quantityOnHand: sql`${inventoryItems.quantityOnHand} - ${quantityToFulfill}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryItems.id, line.itemId),
            sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} >= ${quantityToFulfill}`,
          ),
        )
        .returning({ id: inventoryItems.id });

      if (!stockUpdate) {
        throw new DomainError(
          "Insufficient stock. Request cannot be fulfilled.",
        );
      }
    }

    await createAuditLog(tx, {
      requestId: request.id,
      actorName,
      actorRole: "Admin",
      action: "request_fulfilled",
      fromStatus: request.status,
      toStatus: "fulfilled",
      note: parsed.adminComment ?? undefined,
      metadata: { comment: parsed.adminComment ?? null },
    });

    return updated;
  });
}

async function hydrateRequest(request: {
  id: string;
  requestCode: string;
  requesterId: string;
  requesterName: string;
  department: string;
  warehouse: string;
  requiredBy: Date;
  priority: "low" | "normal" | "high";
  reason: string;
  status: RequestStatus;
  approverId: string | null;
  adminComment: string | null;
  createdAt: Date;
}) {
  const [items, history, approver] = await Promise.all([
    getRequestItems([request.id]),
    db
      .select()
      .from(requestHistory)
      .where(eq(requestHistory.requestId, request.id))
      .orderBy(requestHistory.createdAt),
    request.approverId
      ? db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, request.approverId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const serializedHistory = history.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  }));

  return {
    ...request,
    requiredBy: request.requiredBy.toISOString(),
    createdAt: request.createdAt.toISOString(),
    approverName: approver[0]?.name ?? null,
    items,
    requestHistory: serializedHistory,
    auditLogs: serializedHistory,
  };
}

async function getRequestItems(requestIds: string[]) {
  return db
    .select({
      id: inventoryRequestItems.id,
      requestId: inventoryRequestItems.requestId,
      itemId: inventoryRequestItems.itemId,
      itemName: inventoryItems.name,
      itemSku: inventoryItems.sku,
      itemCategory: inventoryItems.category,
      availableQuantity: sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
      requestedQuantity: inventoryRequestItems.quantityRequested,
      approvedQuantity: inventoryRequestItems.quantityApproved,
      unit: inventoryRequestItems.unit,
    })
    .from(inventoryRequestItems)
    .innerJoin(inventoryItems, eq(inventoryRequestItems.itemId, inventoryItems.id))
    .where(inArray(inventoryRequestItems.requestId, requestIds))
    .orderBy(asc(inventoryItems.name));
}

function groupRequestItems(
  itemRows: Awaited<ReturnType<typeof getRequestItems>>,
) {
  const result = new Map<string, Array<Omit<(typeof itemRows)[number], "requestId">>>();
  for (const row of itemRows) {
    const current = result.get(row.requestId) ?? [];
    const { requestId, ...item } = row;
    current.push(item);
    result.set(requestId, current);
  }
  return result;
}

const listRequestCategoriesCached = cache(
  async function listRequestCategoriesCached(
    viewerId: string,
    viewerRole: User["role"] | "",
  ) {
    const conditions = [];
    if (viewerRole === "employee") {
      conditions.push(eq(inventoryRequests.requesterId, viewerId));
    }

    const rows = await db
      .selectDistinct({ category: inventoryItems.category })
      .from(inventoryItems)
      .innerJoin(
        inventoryRequestItems,
        eq(inventoryRequestItems.itemId, inventoryItems.id),
      )
      .innerJoin(
        inventoryRequests,
        eq(inventoryRequestItems.requestId, inventoryRequests.id),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(inventoryItems.category));

    return rows.map((row) => row.category);
  },
);

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
