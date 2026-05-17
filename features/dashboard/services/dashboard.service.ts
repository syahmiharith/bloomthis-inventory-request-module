import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  auditLogs,
  inventoryItems,
  inventoryRequestItems,
  inventoryRequests,
  users,
  type User,
} from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { RequestStatus } from "@/lib/constants";
import { cachedRead } from "@/lib/server-cache";

type SummaryKey = RequestStatus | "all";

export type DashboardRequestSummary = {
  id: string;
  requestCode: string;
  requesterName: string;
  status: RequestStatus;
  quantityRequested: number;
  createdAt: Date;
  itemNames: string;
};

export type DashboardSummary = Record<
  SummaryKey,
  {
    count: number;
    trendPercent: number;
  }
>;

export type DashboardPageData = {
  inventory: Awaited<ReturnType<typeof getDashboardInventoryKpis>>;
  recentRequests: DashboardRequestSummary[];
  requests: Awaited<ReturnType<typeof getDashboardRequestKpis>>;
};

export type CachedDashboardResult<T> = {
  data: T;
  stale: boolean;
};

const lastGoodDashboardData = new Map<string, DashboardPageData>();
const lastGoodDashboardKpis = new Map<
  string,
  Pick<DashboardPageData, "inventory" | "requests">
>();
const lastGoodDashboardRecent = new Map<
  string,
  DashboardPageData["recentRequests"]
>();
const lastGoodUrgentDashboard = new Map<
  string,
  Awaited<ReturnType<typeof getUrgentDashboardRaw>>
>();
const DASHBOARD_CACHE_VERSION = "v2";

export async function getDashboardSummary(
  viewer: User,
): Promise<DashboardSummary> {
  return getDashboardSummaryCached(viewer.id, viewer.role);
}

const getDashboardSummaryCached = cache(
  async function getDashboardSummaryCached(
    viewerId: string,
    viewerRole: User["role"],
  ): Promise<DashboardSummary> {
    const scopeCondition =
      viewerRole === "employee"
        ? eq(inventoryRequests.requesterId, viewerId)
        : undefined;
    const now = new Date();
    const currentWindowStart = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
    const previousWindowStart = new Date(
      now.getTime() - 60 * 24 * 60 * 60 * 1000,
    );

    const rows = await db
      .select({
        status: inventoryRequests.status,
        total: sql<number>`count(*)::int`,
        currentWindow: sql<number>`count(*) filter (
        where ${inventoryRequests.createdAt} >= ${currentWindowStart.toISOString()}::timestamptz
      )::int`,
        previousWindow: sql<number>`count(*) filter (
        where ${inventoryRequests.createdAt} >= ${previousWindowStart.toISOString()}::timestamptz
        and ${inventoryRequests.createdAt} < ${currentWindowStart.toISOString()}::timestamptz
      )::int`,
      })
      .from(inventoryRequests)
      .where(scopeCondition)
      .groupBy(inventoryRequests.status);

    const initial: DashboardSummary = {
      all: { count: 0, trendPercent: 0 },
      pending: { count: 0, trendPercent: 0 },
      approved: { count: 0, trendPercent: 0 },
      fulfilled: { count: 0, trendPercent: 0 },
      rejected: { count: 0, trendPercent: 0 },
    };

    const totals = rows.reduce(
      (result, row) => ({
        currentWindow: result.currentWindow + row.currentWindow,
        previousWindow: result.previousWindow + row.previousWindow,
        total: result.total + row.total,
      }),
      { currentWindow: 0, previousWindow: 0, total: 0 },
    );

    const summary = rows.reduce((result, row) => {
      const trendPercent = calculateTrend(
        row.currentWindow,
        row.previousWindow,
      );
      result[row.status] = { count: row.total, trendPercent };
      return result;
    }, initial);

    summary.all = {
      count: totals.total,
      trendPercent: calculateTrend(totals.currentWindow, totals.previousWindow),
    };

    return summary;
  },
);

export async function getDashboardPageData(viewer: User) {
  const result = await getCachedDashboardPageData(viewer);
  return result.data;
}

export async function getCachedDashboardPageData(
  viewer: User,
): Promise<CachedDashboardResult<DashboardPageData>> {
  const scope = dashboardScope(viewer);
  try {
    const data = await cachedRead(
      async () => getDashboardPageDataRaw(viewer.id, viewer.role),
      [`dashboard:${scope}:page:${DASHBOARD_CACHE_VERSION}`],
      { tags: [CACHE_TAGS.dashboard, `dashboard:${scope}`] },
    )();
    lastGoodDashboardData.set(scope, data);
    return { data, stale: false };
  } catch (error) {
    const cached = lastGoodDashboardData.get(scope);
    if (cached) {
      return { data: cached, stale: true };
    }
    throw error;
  }
}

export async function getCachedDashboardKpis(
  viewer: User,
): Promise<
  CachedDashboardResult<Pick<DashboardPageData, "inventory" | "requests">>
> {
  const scope = dashboardScope(viewer);
  try {
    const data = await cachedRead(
      async () => {
        const [inventory, requests] = await Promise.all([
          getDashboardInventoryKpisCached(viewer.id, viewer.role),
          getDashboardRequestKpisCached(viewer.id, viewer.role),
        ]);
        return { inventory, requests };
      },
      [`dashboard:${scope}:kpis:${DASHBOARD_CACHE_VERSION}`],
      { tags: [CACHE_TAGS.dashboard, `dashboard:${scope}`] },
    )();
    lastGoodDashboardKpis.set(scope, data);
    return { data, stale: false };
  } catch (error) {
    const cached = lastGoodDashboardKpis.get(scope);
    if (cached) {
      return { data: cached, stale: true };
    }
    throw error;
  }
}

export async function getCachedDashboardRecentRequests(
  viewer: User,
): Promise<CachedDashboardResult<DashboardPageData["recentRequests"]>> {
  const scope = dashboardScope(viewer);
  try {
    const data = await cachedRead(
      async () => getDashboardRecentRequestsCached(viewer.id, viewer.role),
      [`dashboard:${scope}:recent:${DASHBOARD_CACHE_VERSION}`],
      { tags: [CACHE_TAGS.dashboard, `dashboard:${scope}`] },
    )();
    lastGoodDashboardRecent.set(scope, data);
    return { data, stale: false };
  } catch (error) {
    const cached = lastGoodDashboardRecent.get(scope);
    if (cached) {
      return { data: cached, stale: true };
    }
    throw error;
  }
}

export async function getDashboardInventoryKpis(viewer: User) {
  return getDashboardInventoryKpisCached(viewer.id, viewer.role);
}

const getDashboardInventoryKpisCached = cache(
  async function getDashboardInventoryKpisCached(
    _viewerId: string,
    _viewerRole: User["role"],
  ) {
    const rows = await db
      .select({
        totalItems: sql<number>`count(*)::int`,
        availableItems: sql<number>`count(*) filter (
          where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} > 0
        )::int`,
        lowStockItems: sql<number>`count(*) filter (
          where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} <= ${inventoryItems.reorderPoint}
        )::int`,
      })
      .from(inventoryItems);

    return {
      totalItems: rows[0]?.totalItems ?? 0,
      availableItems: rows[0]?.availableItems ?? 0,
      lowStockItems: rows[0]?.lowStockItems ?? 0,
    };
  },
);

export async function getDashboardRequestKpis(viewer: User) {
  return getDashboardRequestKpisCached(viewer.id, viewer.role);
}

const getDashboardRequestKpisCached = cache(
  async function getDashboardRequestKpisCached(
    viewerId: string,
    viewerRole: User["role"],
  ) {
    const requestScope =
      viewerRole === "employee"
        ? eq(inventoryRequests.requesterId, viewerId)
        : undefined;

    const rows = await db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        pendingRequests: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'pending'
        )::int`,
        approvedRequests: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'approved'
        )::int`,
        fulfilledRequests: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'fulfilled'
        )::int`,
        fulfilledThisWeek: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'fulfilled'
          and ${inventoryRequests.fulfilledAt} >= ${weekStart().toISOString()}::timestamptz
        )::int`,
        blockedFulfillment: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'approved'
          and exists (
            select 1
            from inventory_request_items iri
            inner join inventory_items ii on ii.id = iri.item_id
            where iri.request_id = "inventory_requests"."id"
            and ii.quantity_on_hand - ii.quantity_reserved < iri.quantity_requested
          )
        )::int`,
        overSla: sql<number>`count(*) filter (
          where ${inventoryRequests.status} in ('pending', 'approved')
          and ${inventoryRequests.requiredBy} < ${new Date().toISOString()}::timestamptz
        )::int`,
        dueSoon: sql<number>`count(*) filter (
          where ${inventoryRequests.status} in ('pending', 'approved')
          and ${inventoryRequests.requiredBy} >= ${new Date().toISOString()}::timestamptz
          and ${inventoryRequests.requiredBy} <= ${soonDate().toISOString()}::timestamptz
        )::int`,
      })
      .from(inventoryRequests)
      .where(requestScope);

    return {
      approvedRequests: rows[0]?.approvedRequests ?? 0,
      blockedFulfillment: rows[0]?.blockedFulfillment ?? 0,
      dueSoon: rows[0]?.dueSoon ?? 0,
      fulfilledThisWeek: rows[0]?.fulfilledThisWeek ?? 0,
      totalRequests: rows[0]?.totalRequests ?? 0,
      overSla: rows[0]?.overSla ?? 0,
      pendingRequests: rows[0]?.pendingRequests ?? 0,
      fulfilledRequests: rows[0]?.fulfilledRequests ?? 0,
    };
  },
);

export async function getDashboardRecentRequests(viewer: User) {
  return getDashboardRecentRequestsCached(viewer.id, viewer.role);
}

const getDashboardRecentRequestsCached = cache(
  async function getDashboardRecentRequestsCached(
    viewerId: string,
    viewerRole: User["role"],
  ): Promise<DashboardRequestSummary[]> {
    const requestScope =
      viewerRole === "employee"
        ? eq(inventoryRequests.requesterId, viewerId)
        : undefined;

    return db
      .select({
        id: inventoryRequests.id,
        requestCode: inventoryRequests.requestCode,
        requesterName: users.name,
        status: inventoryRequests.status,
        quantityRequested: sql<number>`coalesce(sum(${inventoryRequestItems.quantityRequested}), 0)::int`,
        createdAt: inventoryRequests.createdAt,
        itemNames: sql<string>`coalesce(string_agg(${inventoryItems.name}, ', ' order by ${inventoryItems.name}), 'No items')`,
      })
      .from(inventoryRequests)
      .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
      .leftJoin(
        inventoryRequestItems,
        eq(inventoryRequestItems.requestId, inventoryRequests.id),
      )
      .leftJoin(
        inventoryItems,
        eq(inventoryRequestItems.itemId, inventoryItems.id),
      )
      .where(requestScope)
      .groupBy(inventoryRequests.id, users.name)
      .orderBy(desc(inventoryRequests.createdAt))
      .limit(5);
  },
);

export async function getUrgentDashboard(viewer: User) {
  const result = await getCachedUrgentDashboard(viewer);
  return result.data;
}

export async function getCachedUrgentDashboard(
  viewer: User,
): Promise<
  CachedDashboardResult<Awaited<ReturnType<typeof getUrgentDashboardRaw>>>
> {
  const scope = dashboardScope(viewer);
  try {
    const data = await cachedRead(
      async () => getUrgentDashboardRaw(viewer.id, viewer.role),
      [`dashboard:${scope}:urgent:${DASHBOARD_CACHE_VERSION}`],
      { tags: [CACHE_TAGS.dashboard, `dashboard:${scope}`] },
    )();
    lastGoodUrgentDashboard.set(scope, data);
    return { data, stale: false };
  } catch (error) {
    const cached = lastGoodUrgentDashboard.get(scope);
    if (cached) {
      return { data: cached, stale: true };
    }
    throw error;
  }
}

async function getDashboardPageDataRaw(
  viewerId: string,
  viewerRole: User["role"],
) {
  const [inventory, requests, recentRequests] = await Promise.all([
    getDashboardInventoryKpisCached(viewerId, viewerRole),
    getDashboardRequestKpisCached(viewerId, viewerRole),
    getDashboardRecentRequestsCached(viewerId, viewerRole),
  ]);

  return { inventory, requests, recentRequests };
}

async function getUrgentDashboardRaw(
  viewerId: string,
  viewerRole: User["role"],
) {
  const scopeCondition =
    viewerRole === "employee"
      ? eq(inventoryRequests.requesterId, viewerId)
      : undefined;
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    pendingRows,
    priorityQueueRows,
    inventoryRiskRows,
    restockRecommendationRows,
    recentActivity,
  ] = await Promise.all([
      db
        .select({
          pending: sql<number>`count(*) filter (where ${inventoryRequests.status} = 'pending')::int`,
          approvedWaiting: sql<number>`count(*) filter (where ${inventoryRequests.status} = 'approved')::int`,
          highPriorityPending: sql<number>`count(*) filter (
            where ${inventoryRequests.status} = 'pending' and ${inventoryRequests.priority} = 'high'
          )::int`,
          overdue: sql<number>`count(*) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
            and ${inventoryRequests.requiredBy} < ${now.toISOString()}::timestamptz
          )::int`,
          requiredSoon: sql<number>`count(*) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
            and ${inventoryRequests.requiredBy} >= ${now.toISOString()}::timestamptz
            and ${inventoryRequests.requiredBy} <= ${soon.toISOString()}::timestamptz
          )::int`,
          blockedFulfillment: sql<number>`count(*) filter (
            where ${inventoryRequests.status} = 'approved'
            and exists (
              select 1
              from inventory_request_items iri
              inner join inventory_items ii on ii.id = iri.item_id
              where iri.request_id = ${inventoryRequests.id}
              and ii.quantity_on_hand - ii.quantity_reserved < iri.quantity_requested
            )
          )::int`,
        })
        .from(inventoryRequests)
        .where(scopeCondition),
      db
        .select({
          id: inventoryRequests.id,
          requestCode: inventoryRequests.requestCode,
          requesterName: users.name,
          department: inventoryRequests.department,
          requiredBy: inventoryRequests.requiredBy,
          priority: inventoryRequests.priority,
          status: inventoryRequests.status,
          available: sql<number>`min(${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved})`,
          reorderPoint: sql<number>`max(${inventoryItems.reorderPoint})`,
          shortLines: sql<number>`count(*) filter (
            where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} < ${inventoryRequestItems.quantityRequested}
          )::int`,
          totalQuantity: sql<number>`coalesce(sum(${inventoryRequestItems.quantityRequested}), 0)::int`,
        })
        .from(inventoryRequests)
        .innerJoin(users, eq(inventoryRequests.requesterId, users.id))
        .leftJoin(
          inventoryRequestItems,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .leftJoin(
          inventoryItems,
          eq(inventoryRequestItems.itemId, inventoryItems.id),
        )
        .where(
          and(
            scopeCondition,
            inArray(inventoryRequests.status, ["pending", "approved"]),
          ),
        )
        .groupBy(inventoryRequests.id, users.name)
        .orderBy(
          sql`case
            when ${inventoryRequests.status} = 'approved'
              and count(*) filter (
                where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} < ${inventoryRequestItems.quantityRequested}
              ) > 0 then 0
            when ${inventoryRequests.requiredBy} < ${now.toISOString()}::timestamptz then 1
            when ${inventoryRequests.status} = 'pending' and ${inventoryRequests.priority} = 'high' then 2
            when ${inventoryRequests.status} = 'approved' then 3
            when ${inventoryRequests.requiredBy} <= ${soon.toISOString()}::timestamptz then 4
            else 5
          end`,
          asc(inventoryRequests.requiredBy),
        )
        .limit(5),
      db
        .select({
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          name: inventoryItems.name,
          warehouse: inventoryItems.warehouse,
          available: sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
          reorderPoint: inventoryItems.reorderPoint,
          pendingDemand: sql<number>`coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
          ), 0)::int`,
        })
        .from(inventoryItems)
        .leftJoin(
          inventoryRequestItems,
          eq(inventoryRequestItems.itemId, inventoryItems.id),
        )
        .leftJoin(
          inventoryRequests,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .where(
          lte(
            sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
            inventoryItems.reorderPoint,
          ),
        )
        .groupBy(inventoryItems.id)
        .having(sql`coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
          where ${inventoryRequests.status} in ('pending', 'approved')
        ), 0) > 0`)
        .orderBy(
          asc(
            sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
          ),
          asc(inventoryItems.name),
        )
        .limit(5),
      db
        .select({
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          name: inventoryItems.name,
          warehouse: inventoryItems.warehouse,
          available: sql<number>`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
          activeDemand: sql<number>`coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
          ), 0)::int`,
          suggestedRestockQty: sql<number>`greatest(
            coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
              where ${inventoryRequests.status} in ('pending', 'approved')
            ), 0) - (${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}),
            0
          )::int`,
        })
        .from(inventoryItems)
        .leftJoin(
          inventoryRequestItems,
          eq(inventoryRequestItems.itemId, inventoryItems.id),
        )
        .leftJoin(
          inventoryRequests,
          eq(inventoryRequestItems.requestId, inventoryRequests.id),
        )
        .groupBy(inventoryItems.id)
        .having(sql`greatest(
          coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
            where ${inventoryRequests.status} in ('pending', 'approved')
          ), 0) - (${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}),
          0
        ) > 0`)
        .orderBy(
          desc(sql`greatest(
            coalesce(sum(${inventoryRequestItems.quantityRequested}) filter (
              where ${inventoryRequests.status} in ('pending', 'approved')
            ), 0) - (${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}),
            0
          )`),
          asc(inventoryItems.name),
        )
        .limit(5),
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          actorName: auditLogs.actorName,
          requestCode: inventoryRequests.requestCode,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(
          inventoryRequests,
          eq(auditLogs.requestId, inventoryRequests.id),
        )
        .where(scopeCondition)
        .orderBy(desc(auditLogs.createdAt))
        .limit(5),
    ]);

  const inventoryRisk = inventoryRiskRows.map((item) => ({
    ...item,
    status: item.available <= 0 ? "Out of Stock" : "Low Stock",
  }));
  const priorityQueue = priorityQueueRows.map((request) => ({
    ...request,
    risk: deriveRequestRisk(request, now, soon),
  }));

  const riskCounts = inventoryRisk.reduce(
    (result, item) => ({
      lowStock: result.lowStock + (item.available > 0 ? 1 : 0),
      outOfStock: result.outOfStock + (item.available <= 0 ? 1 : 0),
    }),
    { lowStock: 0, outOfStock: 0 },
  );

  return {
    alerts: {
      pending: pendingRows[0]?.pending ?? 0,
      approvedWaiting: pendingRows[0]?.approvedWaiting ?? 0,
      blockedFulfillment: pendingRows[0]?.blockedFulfillment ?? 0,
      highPriorityPending: pendingRows[0]?.highPriorityPending ?? 0,
      overdue: pendingRows[0]?.overdue ?? 0,
      requiredSoon: pendingRows[0]?.requiredSoon ?? 0,
      ...riskCounts,
    },
    priorityQueue,
    inventoryRisk,
    restockRecommendations: restockRecommendationRows,
    recentActivity,
  };
}

function dashboardScope(viewer: Pick<User, "id" | "role">) {
  return viewer.role === "admin" ? "admin" : `employee:${viewer.id}`;
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function deriveRequestRisk(
  request: {
    requiredBy: Date;
    available: number | null;
    reorderPoint: number | null;
    priority: "low" | "normal" | "high";
    shortLines?: number;
    status?: RequestStatus;
  },
  now: Date,
  soon: Date,
) {
  if (request.status === "approved" && (request.shortLines ?? 0) > 0) {
    return "Blocked";
  }
  if (request.requiredBy < now) {
    return "Overdue";
  }
  if (request.status === "approved") {
    return "Ready";
  }
  if (request.available !== null && request.available <= 0) {
    return "Out of Stock";
  }
  if (
    request.available !== null &&
    request.reorderPoint !== null &&
    request.available <= request.reorderPoint
  ) {
    return "Low Stock";
  }
  if (request.priority === "high") {
    return "High Priority";
  }
  if (request.requiredBy <= soon) {
    return "Due Soon";
  }
  return "Pending";
}

function weekStart() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  return start;
}

function soonDate() {
  return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
}
