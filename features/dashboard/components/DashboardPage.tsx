import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageCheck,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUserForShell } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/ui/Kpi";
import { StatusBadge } from "@/components/ui/badges/StatusBadge";
import {
  getCachedDashboardKpis,
  getCachedDashboardRecentRequests,
  getCachedUrgentDashboard,
} from "@/features/dashboard/services/dashboard.service";

const DASHBOARD_CARD_ITEM_LIMIT = 5;

export default async function HomePage() {
  const currentUser = await getCurrentUserForShell();
  const [kpis, priority, recent] = await Promise.all([
    safeDashboardSection(
      "dashboard:kpis",
      () => getCachedDashboardKpis(currentUser),
      {
        data: {
          inventory: emptyDashboardData.inventory,
          requests: emptyDashboardData.requests,
        },
        stale: false,
      },
    ),
    safeDashboardSection(
      "dashboard:priority",
      () => getCachedUrgentDashboard(currentUser),
      { data: emptyUrgentData, stale: false },
    ),
    safeDashboardSection(
      "dashboard:recent",
      () => getCachedDashboardRecentRequests(currentUser),
      { data: emptyDashboardData.recentRequests, stale: false },
    ),
  ]);
  const kpiData = normalizeDashboardKpis(kpis.data.data);
  const dashboard = {
    inventory: kpiData.inventory,
    recentRequests: recent.data.data ?? [],
    requests: kpiData.requests,
  };
  const urgent = normalizeUrgentData(priority.data.data);
  const hasDashboardDataIssue = !kpis.available;
  const hasStaleDashboardData =
    kpis.data.stale || priority.data.stale || recent.data.stale;
  const isAdmin = currentUser.role === "admin";
  const openRequests =
    dashboard.requests.pendingRequests + dashboard.requests.approvedRequests;
  const slaCompliance = calculateSlaCompliance(
    openRequests,
    dashboard.requests.overSla,
  );
  const actionEntries = buildActionEntries(urgent).slice(
    0,
    DASHBOARD_CARD_ITEM_LIMIT,
  );
  const slaEntries = buildSlaEntries(dashboard.requests, urgent.alerts).slice(
    0,
    DASHBOARD_CARD_ITEM_LIMIT,
  );
  const businessValueEntries = buildBusinessValueEntries(urgent).slice(
    0,
    DASHBOARD_CARD_ITEM_LIMIT,
  );

  return (
    <main
      className="page-scroll main-scroll-region route-page dashboard-route"
      data-testid="main-scroll-region"
    >
      <section
        data-analytics-view="dashboard_viewed"
        data-testid="dashboard-page"
      >
        <PageHeader
          title={isAdmin ? "Operations Dashboard" : "Request Dashboard"}
          description={
            isAdmin
              ? "Review request workload, SLA exposure, and inventory risk from one operational view."
              : "Monitor request progress and submit inventory needs from one workspace."
          }
        />
        {hasDashboardDataIssue ? (
          <p className="alert alert-info dashboard-data-alert" role="status">
            Dashboard data temporarily unavailable.
          </p>
        ) : hasStaleDashboardData ? (
          <p className="alert alert-info dashboard-data-alert" role="status">
            Dashboard data may be slightly stale.
          </p>
        ) : null}

        <KpiGrid testId="dashboard-summary-cards">
          {isAdmin ? (
            <>
              <KpiCard
                footerHref="/requests"
                icon={<ShieldCheck />}
                label="SLA Compliance"
                value={`${slaCompliance}%`}
                note={`${dashboard.requests.overSla} over SLA`}
                tone={dashboard.requests.overSla > 0 ? "red" : "green"}
              />
              <KpiCard
                footerHref="/requests?status=fulfilled"
                icon={<CheckCircle2 />}
                label="Resolved This Week"
                value={dashboard.requests.fulfilledThisWeek}
                note={`${dashboard.requests.fulfilledRequests} total fulfilled`}
                tone="green"
              />
              <KpiCard
                footerHref="/requests?status=approved"
                icon={<ClipboardList />}
                label="Blocked Requests"
                value={dashboard.requests.blockedFulfillment}
                note="Approved requests with insufficient stock"
                tone="red"
              />
              <KpiCard
                footerHref="/inventory?stock=out"
                icon={<AlertTriangle />}
                label="Stockout Risk"
                value={urgent.alerts.outOfStock}
                note="Out-of-stock items with demand"
                tone={urgent.alerts.outOfStock > 0 ? "red" : "blue"}
              />
            </>
          ) : (
            <>
              <KpiCard
                footerHref="/requests"
                icon={<ClipboardList />}
                label="Open Requests"
                value={openRequests}
                note={`${dashboard.requests.approvedRequests} approved`}
                tone="amber"
              />
              <KpiCard
                footerHref="/requests?status=approved"
                icon={<PackageCheck />}
                label="Approved Requests"
                value={dashboard.requests.approvedRequests}
                note="Waiting fulfillment"
                tone="green"
              />
              <KpiCard
                footerHref="/requests?status=fulfilled"
                icon={<PackageCheck />}
                label="Fulfilled Requests"
                value={dashboard.requests.fulfilledRequests}
                note="Completed requests"
                tone="green"
              />
              <KpiCard
                footerHref="/requests/new"
                icon={<PlusCircle />}
                label="Create Request"
                value="Start"
                note={`${dashboard.inventory.availableItems} items available`}
                tone="blue"
              />
            </>
          )}
        </KpiGrid>

        <div className="dashboard-grid refined-dashboard-grid">
          <section className="panel dashboard-card">
            <PanelHeading
              title="Today's Action Queue"
              subtitle={
                isAdmin
                  ? "Prioritized actions ranked by SLA, stock, and fulfillment risk."
                  : "Requests requiring attention or currently moving through fulfillment."
              }
            />
            {actionEntries.length === 0 ? (
              <ActionableEmptyState
                href={isAdmin ? "/inventory?stock=low" : "/requests/new"}
                label={
                  isAdmin
                    ? "No priority actions at this time. Review low-stock inventory"
                    : "No pending action required. Create a new request"
                }
              />
            ) : (
              <div className="dashboard-action-list dashboard-card-body">
                {actionEntries.map((entry) => (
                  <ActionQueueRow entry={entry} key={entry.key} />
                ))}
              </div>
            )}
            <PanelFooter
              analyticsName="action_queue_clicked"
              href={isAdmin ? "/requests?status=pending" : "/requests"}
              label={isAdmin ? "Open request queue" : "View my requests"}
            />
          </section>

          <section
            className="panel dashboard-card"
            data-testid="dashboard-sla-aging"
          >
            <PanelHeading
              title={isAdmin ? "SLA and Aging" : "Request Aging"}
              subtitle="Review delayed, due-soon, and fulfillment-waiting requests."
            />
            {slaEntries.length === 0 ? (
              <ActionableEmptyState
                href="/requests?status=approved"
                label="No aging risk at this time. Review approved requests"
              />
            ) : (
              <div className="dashboard-signal-list dashboard-card-body">
                {slaEntries.map((entry) => (
                  <DashboardSignalRow entry={entry} key={entry.key} />
                ))}
              </div>
            )}
            <PanelFooter href="/requests" label="Review request aging" />
          </section>

          {isAdmin ? (
            <section className="panel dashboard-card">
              <PanelHeading
                title="Restock Recommendations"
                subtitle="Items where active demand exceeds available stock."
              />
              {urgent.restockRecommendations.length === 0 ? (
                <ActionableEmptyState
                  href="/inventory?stock=low"
                  label="No restock recommendations at this time. Review low-stock inventory"
                />
              ) : (
                <div className="dashboard-signal-list dashboard-card-body">
                  {urgent.restockRecommendations
                    .slice(0, DASHBOARD_CARD_ITEM_LIMIT)
                    .map((item) => (
                      <Link
                        className="dashboard-signal-row"
                        data-analytics="restock_recommendation_clicked"
                        href={`/inventory/${item.id}`}
                        key={item.id}
                        title={`${item.name} - ${item.sku}`}
                      >
                        <span className="badge badge-amber">Restock</span>
                        <strong>{item.name}</strong>
                        <span>
                          Available {item.available} · demand{" "}
                          {item.activeDemand}
                        </span>
                        <em>+{item.suggestedRestockQty}</em>
                        <ArrowRight />
                      </Link>
                    ))}
                </div>
              )}
              <PanelFooter href="/inventory?stock=low" label="Plan restock" />
            </section>
          ) : (
            <section
              className="panel dashboard-card"
              data-testid="dashboard-recent-requests"
            >
              <PanelHeading
                title="Request Status Overview"
                subtitle="Recent requests and current fulfillment status."
              />
              <RecentRequestsList
                available={recent.available}
                requests={dashboard.recentRequests}
              />
              <PanelFooter href="/requests" label="Track all requests" />
            </section>
          )}

          {isAdmin ? (
            <section className="panel dashboard-card">
              <PanelHeading
                title="Operational Risk Signals"
                subtitle="Inventory and request patterns that may affect service levels."
              />
              <div className="dashboard-signal-list dashboard-card-body">
                {businessValueEntries.map((entry) => (
                  <DashboardSignalRow entry={entry} key={entry.key} />
                ))}
              </div>
              <PanelFooter href="/inventory" label="Review inventory risk" />
            </section>
          ) : null}

          {isAdmin ? (
            <section
              className="panel dashboard-card"
              data-testid="dashboard-recent-requests"
            >
              <PanelHeading
                title="Recent Requests"
                subtitle="Latest inventory requests across the company."
              />
              <RecentRequestsList
                available={recent.available}
                requests={dashboard.recentRequests}
              />
              <PanelFooter href="/requests" label="Open request list" />
            </section>
          ) : null}

          <section className="panel dashboard-card">
            <PanelHeading
              title="Quick Actions"
              subtitle={
                isAdmin
                  ? "Common operational workflows for inventory and request management."
                  : "Common workflows for inventory browsing and request submission."
              }
            />
            <div className="quick-action-list dashboard-card-body">
              {isAdmin ? (
                <>
                  <QuickAction
                    href="/requests?status=approved"
                    icon={<PackageCheck />}
                    title="Fulfillment Queue"
                    description={`${dashboard.requests.approvedRequests} approved requests`}
                    primary
                  />
                  <QuickAction
                    href="/requests?status=pending"
                    icon={<ClipboardList />}
                    title="Approval Queue"
                    description={`${dashboard.requests.pendingRequests} pending reviews`}
                  />
                  <QuickAction
                    href="/inventory?stock=out"
                    icon={<AlertTriangle />}
                    title="Resolve Stockouts"
                    description={`${urgent.alerts.outOfStock} out-of-stock items`}
                  />
                  <QuickAction
                    href="/inventory/new"
                    icon={<PlusCircle />}
                    title="Add Inventory Item"
                    description="Create a new stock record"
                  />
                </>
              ) : (
                <>
                  <QuickAction
                    href="/requests/new"
                    icon={<PlusCircle />}
                    title="Create Request"
                    description="Submit an inventory request"
                    primary
                  />
                  <QuickAction
                    href="/inventory"
                    icon={<PackageCheck />}
                    title="Browse Inventory"
                    description={`${dashboard.inventory.availableItems} available items`}
                  />
                  <QuickAction
                    href="/requests?status=approved"
                    icon={<Clock />}
                    title="Approved Requests"
                    description={`${dashboard.requests.approvedRequests} awaiting fulfillment`}
                  />
                  <QuickAction
                    href="/requests?status=fulfilled"
                    icon={<PackageCheck />}
                    title="View Fulfilled Requests"
                    description={`${dashboard.requests.fulfilledRequests} completed requests`}
                  />
                </>
              )}
            </div>
            <PanelFooter
              href={isAdmin ? "/requests?status=approved" : "/requests/new"}
              label={isAdmin ? "Open fulfillment queue" : "Create request"}
            />
          </section>

          <section className="panel dashboard-card">
            <PanelHeading
              title="Recent Activity"
              subtitle="Latest request and inventory events."
            />
            <div className="timeline-list dashboard-card-body">
              {urgent.recentActivity.length === 0 ? (
                <p className="empty-state">
                  {priority.available
                    ? "No recent activity yet."
                    : "Recent activity temporarily unavailable."}
                </p>
              ) : null}
              {urgent.recentActivity
                .slice(0, DASHBOARD_CARD_ITEM_LIMIT)
                .map((entry) => (
                  <article
                    className={`timeline-item ${timelineTone(entry.action)}`}
                    key={entry.id}
                  >
                    <span className="timeline-dot" />
                    <div>
                      <strong>{entry.action.replaceAll("_", " ")}</strong>
                      <p>{entry.requestCode ?? "Inventory activity"}</p>
                    </div>
                    <time>{formatDate(entry.createdAt)}</time>
                  </article>
                ))}
            </div>
            <PanelFooter href="/requests" />
          </section>
        </div>
      </section>
    </main>
  );
}

function PanelHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="panel-header stacked-panel-header">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function ActionQueueRow({ entry }: { entry: DashboardActionEntry }) {
  return (
    <Link
      className="dashboard-action-row"
      data-analytics="action_queue_clicked"
      href={entry.href}
      title={`${entry.entity} - ${entry.reason}`}
    >
      <span className={`badge ${dashboardBadgeClass(entry.priority)}`}>
        {entry.priority}
      </span>
      <strong>{entry.entity}</strong>
      <span>{entry.reason}</span>
      <span>{entry.owner}</span>
      <em>{entry.action}</em>
      <ArrowRight />
    </Link>
  );
}

function DashboardSignalRow({ entry }: { entry: DashboardSignalEntry }) {
  return (
    <Link
      className="dashboard-signal-row"
      data-analytics="dashboard_card_clicked"
      href={entry.href}
      title={`${entry.title} - ${entry.reason}`}
    >
      <span className={`badge ${entry.badgeClass}`}>{entry.badge}</span>
      <strong>{entry.title}</strong>
      <span>{entry.reason}</span>
      <em>{entry.value}</em>
      <ArrowRight />
    </Link>
  );
}

function RecentRequestsList({
  available,
  requests,
}: {
  available: boolean;
  requests: typeof emptyDashboardData.recentRequests;
}) {
  if (requests.length === 0) {
    return (
      <ActionableEmptyState
        href="/requests/new"
        label={
          available
            ? "No requests yet. Create the first request"
            : "Recent requests temporarily unavailable. Open requests"
        }
      />
    );
  }

  return (
    <div className="dashboard-action-list dashboard-card-body">
      {requests.slice(0, DASHBOARD_CARD_ITEM_LIMIT).map((request) => (
        <Link
          className="dashboard-action-row"
          data-analytics="dashboard_card_clicked"
          href={`/requests/${request.id}`}
          key={request.id}
          title={`${request.requestCode} - ${request.itemNames}`}
        >
          <StatusBadge status={request.status} />
          <strong>{request.requestCode}</strong>
          <span>{request.requesterName}</span>
          <span>
            {request.quantityRequested} units · {request.itemNames}
          </span>
          <em>Open</em>
          <ArrowRight />
        </Link>
      ))}
    </div>
  );
}

function ActionableEmptyState({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link className="dashboard-empty-action dashboard-card-body" href={href}>
      <span>{label}</span>
      <ArrowRight />
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={`quick-action-row ${primary ? "is-primary" : ""}`}
      data-analytics="dashboard_card_clicked"
      href={href}
    >
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <ArrowRight />
    </Link>
  );
}

function PanelFooter({
  href,
  analyticsName = "dashboard_card_clicked",
  label = "See more",
}: {
  analyticsName?: string;
  href: string;
  label?: string;
}) {
  return (
    <Link
      className="panel-footer-link"
      data-analytics={analyticsName}
      href={href}
    >
      {label}
      <ArrowRight />
    </Link>
  );
}

type DashboardActionEntry = {
  action: string;
  entity: string;
  href: string;
  key: string;
  owner: string;
  priority: string;
  reason: string;
};

type DashboardSignalEntry = {
  badge: string;
  badgeClass: string;
  href: string;
  key: string;
  reason: string;
  title: string;
  value: string | number;
};

function buildActionEntries(urgent: typeof emptyUrgentData) {
  const requestEntries = urgent.priorityQueue.map((request) => ({
    action: actionForRisk(request.risk),
    entity: request.requestCode,
    href: `/requests/${request.id}`,
    key: `request:${request.id}`,
    owner: request.requesterName,
    priority: request.risk,
    reason: `${request.department} · ${request.totalQuantity} units`,
  }));

  const inventoryEntries = urgent.inventoryRisk.map((item) => ({
    action: "Review stock",
    entity: item.name,
    href: `/inventory/${item.id}`,
    key: `inventory-risk:${item.id}`,
    owner: item.status,
    priority: item.status,
    reason: `${item.pendingDemand} units in active demand`,
  }));

  const restockEntries = urgent.restockRecommendations.map((item) => ({
    action: "Restock",
    entity: item.name,
    href: `/inventory/${item.id}`,
    key: `restock:${item.id}`,
    owner: item.warehouse,
    priority: "Restock",
    reason: `Need ${item.suggestedRestockQty} more units`,
  }));

  return [...requestEntries, ...inventoryEntries, ...restockEntries];
}

function buildSlaEntries(
  requests: typeof emptyDashboardData.requests,
  alerts: typeof emptyUrgentData.alerts,
): DashboardSignalEntry[] {
  return [
    {
      badge: "Review",
      badgeClass: "badge-amber",
      href: "/requests?status=pending",
      key: "pending-review",
      reason: "Requests waiting for admin decision",
      title: "Pending review",
      value: requests.pendingRequests,
    },
    {
      badge: "Fulfill",
      badgeClass: "badge-blue",
      href: "/requests?status=approved",
      key: "approved-waiting",
      reason: "Approved requests waiting for issue",
      title: "Approved waiting",
      value: alerts.approvedWaiting,
    },
    {
      badge: "Blocked",
      badgeClass: "badge-red",
      href: "/requests?status=approved",
      key: "blocked-fulfillment",
      reason: "Approved requests with insufficient stock",
      title: "Blocked fulfillment",
      value: requests.blockedFulfillment,
    },
    {
      badge: "SLA",
      badgeClass: "badge-red",
      href: "/requests",
      key: "over-sla",
      reason: "Open requests past required date",
      title: "Requests over SLA",
      value: requests.overSla,
    },
    {
      badge: "Soon",
      badgeClass: "badge-amber",
      href: "/requests",
      key: "due-soon",
      reason: "Open requests due in the next 3 days",
      title: "Due soon",
      value: requests.dueSoon,
    },
  ];
}

function buildBusinessValueEntries(
  urgent: typeof emptyUrgentData,
): DashboardSignalEntry[] {
  return [
    {
      badge: "Demand",
      badgeClass: "badge-red",
      href: "/inventory?stock=out",
      key: "stockout-demand",
      reason: "Stockouts with active request demand",
      title: "Stockout with demand",
      value: urgent.alerts.outOfStock,
    },
    {
      badge: "Warning",
      badgeClass: "badge-amber",
      href: "/inventory?stock=low",
      key: "low-stock-demand",
      reason: "Low-stock items that already have active demand",
      title: "Low stock pressure",
      value: urgent.alerts.lowStock,
    },
    {
      badge: "Prepared",
      badgeClass: "badge-blue",
      href: "/inventory",
      key: "overstock-risk",
      reason: "Monitor high stock with low request activity",
      title: "Overstock risk signal",
      value: "Ready",
    },
    {
      badge: "Prepared",
      badgeClass: "badge-blue",
      href: "/requests",
      key: "duplicate-request-risk",
      reason: "Use request history to spot repeated asks",
      title: "Duplicate request signal",
      value: "Ready",
    },
  ];
}

function actionForRisk(risk: string) {
  const normalized = risk.toLowerCase();
  if (normalized.includes("blocked") || normalized.includes("out")) {
    return "Resolve stock";
  }
  if (normalized.includes("ready")) {
    return "Fulfill";
  }
  if (normalized.includes("overdue") || normalized.includes("pending")) {
    return "Review";
  }
  if (normalized.includes("restock")) {
    return "Restock";
  }
  return "Open";
}

function calculateSlaCompliance(openRequests: number, overSla: number) {
  if (openRequests <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(((openRequests - overSla) / openRequests) * 100)),
  );
}

function dashboardBadgeClass(label: string) {
  const normalized = label.toLowerCase();
  if (
    normalized.includes("blocked") ||
    normalized.includes("out") ||
    normalized.includes("overdue")
  ) {
    return "badge-red";
  }
  if (
    normalized.includes("low") ||
    normalized.includes("soon") ||
    normalized.includes("pending") ||
    normalized.includes("restock")
  ) {
    return "badge-amber";
  }
  if (
    normalized.includes("approved") ||
    normalized.includes("fulfilled") ||
    normalized.includes("ready")
  ) {
    return "badge-green";
  }
  return "badge-blue";
}

function timelineTone(action: string) {
  if (action.includes("fulfilled")) return "is-fulfilled";
  if (action.includes("approved")) return "is-approved";
  if (action.includes("rejected")) return "is-rejected";
  return "is-created";
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const emptyDashboardData = {
  inventory: {
    availableItems: 0,
    lowStockItems: 0,
    totalItems: 0,
  },
  recentRequests: [] as Array<{
    createdAt: Date | string;
    id: string;
    itemNames: string;
    quantityRequested: number;
    requestCode: string;
    requesterName: string;
    status: "pending" | "approved" | "rejected" | "fulfilled";
  }>,
  requests: {
    approvedRequests: 0,
    blockedFulfillment: 0,
    dueSoon: 0,
    fulfilledRequests: 0,
    fulfilledThisWeek: 0,
    overSla: 0,
    pendingRequests: 0,
    totalRequests: 0,
  },
};

function normalizeDashboardKpis(
  data: Partial<typeof emptyDashboardData> & {
    inventory?: Partial<typeof emptyDashboardData.inventory>;
    requests?: Partial<typeof emptyDashboardData.requests>;
  },
) {
  return {
    inventory: {
      ...emptyDashboardData.inventory,
      ...(data.inventory ?? {}),
    },
    requests: {
      ...emptyDashboardData.requests,
      ...(data.requests ?? {}),
    },
  };
}

const emptyUrgentData = {
  alerts: {
    approvedWaiting: 0,
    blockedFulfillment: 0,
    highPriorityPending: 0,
    lowStock: 0,
    outOfStock: 0,
    overdue: 0,
    pending: 0,
    requiredSoon: 0,
  },
  inventoryRisk: [] as Array<{
    id: string;
    name: string;
    pendingDemand: number;
    status: string;
  }>,
  priorityQueue: [] as Array<{
    department: string;
    id: string;
    priority: "low" | "normal" | "high";
    requestCode: string;
    requesterName: string;
    risk: string;
    shortLines: number;
    status: "pending" | "approved" | "rejected" | "fulfilled";
    totalQuantity: number;
  }>,
  recentActivity: [] as Array<{
    action: string;
    createdAt: Date | string;
    id: string;
    requestCode: string | null;
  }>,
  restockRecommendations: [] as Array<{
    activeDemand: number;
    available: number;
    id: string;
    name: string;
    sku: string;
    suggestedRestockQty: number;
    warehouse: string;
  }>,
};

function normalizeUrgentData(
  data: Partial<typeof emptyUrgentData> & {
    alerts?: Partial<typeof emptyUrgentData.alerts>;
  },
) {
  return {
    alerts: {
      ...emptyUrgentData.alerts,
      ...(data.alerts ?? {}),
    },
    inventoryRisk: data.inventoryRisk ?? [],
    priorityQueue: data.priorityQueue ?? [],
    recentActivity: data.recentActivity ?? [],
    restockRecommendations: data.restockRecommendations ?? [],
  };
}

async function safeDashboardSection<T>(
  label: "dashboard:kpis" | "dashboard:priority" | "dashboard:recent",
  load: () => Promise<T>,
  fallback: T,
): Promise<{ available: boolean; data: T }> {
  const guarded = withDashboardTiming(label, load)
    .then((data) => ({ available: true, data }))
    .catch((error: unknown) => {
      logDashboardIssue(label, error);
      return { available: false, data: fallback };
    });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutResult = new Promise<{ available: boolean; data: T }>(
    (resolve) => {
      timeout = setTimeout(() => {
        logDashboardIssue(label, new Error("Dashboard section timed out"));
        resolve({ available: false, data: fallback });
      }, 4_000);
    },
  );

  return Promise.race([guarded, timeoutResult]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

async function withDashboardTiming<T>(label: string, load: () => Promise<T>) {
  if (process.env.NODE_ENV !== "development") {
    return load();
  }

  const startedAt = performance.now();
  try {
    return await load();
  } finally {
    console.info(
      `[db:${label}] ${Math.round(performance.now() - startedAt)}ms`,
    );
  }
}

function logDashboardIssue(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[db:${label}] fallback: ${message}`);
}
