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
import type { RequestStatus } from "@/lib/constants";

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

export async function getDashboardSummary(
  viewer: User,
): Promise<DashboardSummary> {
  return getDashboardSummaryCached(viewer.id, viewer.role);
}

const getDashboardSummaryCached = cache(async function getDashboardSummaryCached(
  viewerId: string,
  viewerRole: User["role"],
): Promise<DashboardSummary> {
  const scopeCondition =
    viewerRole === "employee"
      ? eq(inventoryRequests.requesterId, viewerId)
      : undefined;
  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
    const trendPercent = calculateTrend(row.currentWindow, row.previousWindow);
    result[row.status] = { count: row.total, trendPercent };
    return result;
  }, initial);

  summary.all = {
    count: totals.total,
    trendPercent: calculateTrend(totals.currentWindow, totals.previousWindow),
  };

  return summary;
});

export async function getDashboardPageData(viewer: User) {
  return getDashboardPageDataCached(viewer.id, viewer.role);
}

const getDashboardPageDataCached = cache(async function getDashboardPageDataCached(
  viewerId: string,
  viewerRole: User["role"],
) {
  const requestScope =
    viewerRole === "employee"
      ? eq(inventoryRequests.requesterId, viewerId)
      : undefined;

  const [inventoryTotals, requestTotals, recentRequests] = await Promise.all([
    db
      .select({
        totalItems: sql<number>`count(*)::int`,
        availableItems: sql<number>`count(*) filter (
          where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} > 0
        )::int`,
        lowStockItems: sql<number>`count(*) filter (
          where ${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved} <= ${inventoryItems.reorderPoint}
        )::int`,
      })
      .from(inventoryItems),
    db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        pendingRequests: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'pending'
        )::int`,
        fulfilledRequests: sql<number>`count(*) filter (
          where ${inventoryRequests.status} = 'fulfilled'
        )::int`,
      })
      .from(inventoryRequests)
      .where(requestScope),
    db
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
      .limit(5),
  ]);

  return {
    inventory: {
      totalItems: inventoryTotals[0]?.totalItems ?? 0,
      availableItems: inventoryTotals[0]?.availableItems ?? 0,
      lowStockItems: inventoryTotals[0]?.lowStockItems ?? 0,
    },
    requests: {
      totalRequests: requestTotals[0]?.totalRequests ?? 0,
      pendingRequests: requestTotals[0]?.pendingRequests ?? 0,
      fulfilledRequests: requestTotals[0]?.fulfilledRequests ?? 0,
    },
    recentRequests,
  };
});

export async function getUrgentDashboard(viewer: User) {
  return getUrgentDashboardCached(viewer.id, viewer.role);
}

const getUrgentDashboardCached = cache(async function getUrgentDashboardCached(
  viewerId: string,
  viewerRole: User["role"],
) {
  const scopeCondition =
    viewerRole === "employee"
      ? eq(inventoryRequests.requesterId, viewerId)
      : undefined;
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [pendingRows, priorityQueueRows, inventoryRiskRows, recentActivity] =
    await Promise.all([
      db
        .select({
          pending: sql<number>`count(*) filter (where ${inventoryRequests.status} = 'pending')::int`,
          highPriorityPending: sql<number>`count(*) filter (
            where ${inventoryRequests.status} = 'pending' and ${inventoryRequests.priority} = 'high'
          )::int`,
          overdue: sql<number>`count(*) filter (
            where ${inventoryRequests.status} = 'pending' and ${inventoryRequests.requiredBy} < ${now.toISOString()}::timestamptz
          )::int`,
          requiredSoon: sql<number>`count(*) filter (
            where ${inventoryRequests.status} = 'pending'
            and ${inventoryRequests.requiredBy} >= ${now.toISOString()}::timestamptz
            and ${inventoryRequests.requiredBy} <= ${soon.toISOString()}::timestamptz
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
          available: sql<number>`min(${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved})`,
          reorderPoint: sql<number>`max(${inventoryItems.reorderPoint})`,
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
        .where(and(scopeCondition, eq(inventoryRequests.status, "pending")))
        .groupBy(inventoryRequests.id, users.name)
        .orderBy(
          sql`case when ${inventoryRequests.requiredBy} < ${now.toISOString()}::timestamptz then 0 else 1 end`,
          sql`case when ${inventoryRequests.priority} = 'high' then 0 else 1 end`,
          asc(inventoryRequests.requiredBy),
        )
        .limit(7),
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
        .orderBy(
          asc(
            sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`,
          ),
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
        .orderBy(desc(auditLogs.createdAt))
        .limit(7),
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
      highPriorityPending: pendingRows[0]?.highPriorityPending ?? 0,
      overdue: pendingRows[0]?.overdue ?? 0,
      requiredSoon: pendingRows[0]?.requiredSoon ?? 0,
      ...riskCounts,
    },
    priorityQueue,
    inventoryRisk,
    recentActivity,
  };
});

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
  },
  now: Date,
  soon: Date,
) {
  if (request.requiredBy < now) {
    return "Overdue";
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
