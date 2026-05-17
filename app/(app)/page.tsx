import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Package,
  PackageCheck,
  PlusCircle,
} from "lucide-react";
import { getCurrentUserForShell } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/ui/Kpi";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getCachedDashboardKpis,
  getCachedDashboardRecentRequests,
  getCachedUrgentDashboard,
} from "@/services/dashboard.service";

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
  const dashboard = {
    inventory: kpis.data.data.inventory,
    recentRequests: recent.data.data,
    requests: kpis.data.data.requests,
  };
  const urgent = priority.data.data;
  const hasDashboardDataIssue =
    !kpis.available || !priority.available || !recent.available;
  const hasStaleDashboardData =
    kpis.data.stale || priority.data.stale || recent.data.stale;
  const isAdmin = currentUser.role === "admin";
  const priorityEntries = [
    ...urgent.priorityQueue.map((request) => ({
      href: `/requests/${request.id}`,
      label: request.risk,
      reason: `${request.requestCode} · ${request.department}`,
      target: request.requesterName,
    })),
    ...urgent.inventoryRisk.map((item) => ({
      href: `/inventory/${item.id}`,
      label: item.status,
      reason: `${item.pendingDemand} units in active demand`,
      target: item.name,
    })),
  ].slice(0, DASHBOARD_CARD_ITEM_LIMIT);

  return (
    <main
      className="page-scroll main-scroll-region route-page dashboard-route"
      data-testid="main-scroll-region"
    >
      <section data-testid="dashboard-page">
        <PageHeader
          title={isAdmin ? "Inventory Dashboard" : "My Inventory Requests"}
          description={
            isAdmin
              ? "Monitor stock, pending requests, and recent request activity."
              : "Browse available inventory and track your demo-user requests."
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
                footerHref="/inventory"
                icon={<Package />}
                label="Total Items"
                value={dashboard.inventory.totalItems}
                note="Inventory records"
                tone="blue"
              />
              <KpiCard
                footerHref="/inventory?stock=low"
                icon={<AlertTriangle />}
                label="Low Stock"
                value={dashboard.inventory.lowStockItems}
                note="Needs attention"
                tone="amber"
              />
              <KpiCard
                footerHref="/requests?status=pending"
                icon={<ClipboardList />}
                label="Pending Requests"
                value={dashboard.requests.pendingRequests}
                note="Waiting for review"
                tone="red"
              />
              <KpiCard
                footerHref="/requests?status=fulfilled"
                icon={<PackageCheck />}
                label="Fulfilled Requests"
                value={dashboard.requests.fulfilledRequests}
                note="Completed requests"
                tone="green"
              />
            </>
          ) : (
            <>
              <KpiCard
                footerHref="/inventory"
                icon={<PackageCheck />}
                label="Available Items"
                value={dashboard.inventory.availableItems}
                note="Currently requestable"
                tone="blue"
              />
              <KpiCard
                footerHref="/requests"
                icon={<ClipboardList />}
                label="My Requests"
                value={dashboard.requests.totalRequests}
                note={currentUser.name}
                tone="green"
              />
              <KpiCard
                footerHref="/requests?status=pending"
                icon={<AlertTriangle />}
                label="Pending Requests"
                value={dashboard.requests.pendingRequests}
                note="Awaiting admin review"
                tone="amber"
              />
              <KpiCard
                footerHref="/requests?status=fulfilled"
                icon={<PackageCheck />}
                label="Fulfilled Requests"
                value={dashboard.requests.fulfilledRequests}
                note="Completed for this user"
                tone="green"
              />
            </>
          )}
        </KpiGrid>

        <div className="dashboard-grid refined-dashboard-grid">
          <section className="panel dashboard-card">
            <PanelHeading
              title="Priority Action Queue"
              subtitle="Highest-priority stock and request work."
            />
            <div className="dashboard-risk-list dashboard-card-body">
              {priorityEntries.map((entry) => (
                <Link
                  className="dashboard-risk-row"
                  href={entry.href}
                  key={entry.href}
                >
                  <span className={`badge ${dashboardBadgeClass(entry.label)}`}>
                    {entry.label}
                  </span>
                  <strong>{entry.target}</strong>
                  <span>{entry.reason}</span>
                  <ArrowRight />
                </Link>
              ))}
            </div>
            {priority.available &&
            urgent.priorityQueue.length === 0 &&
            urgent.inventoryRisk.length === 0 ? (
              <p className="empty-state dashboard-card-body">
                No priority actions right now.
              </p>
            ) : null}
            <PanelFooter
              href={isAdmin ? "/requests?status=pending" : "/requests"}
            />
          </section>

          <section
            className="panel dashboard-card"
            data-testid="dashboard-recent-requests"
          >
            <PanelHeading
              title={isAdmin ? "Recent Requests" : "My Recent Requests"}
              subtitle={
                isAdmin
                  ? "Latest inventory requests across the company."
                  : "Latest requests for the current demo employee."
              }
            />
            {dashboard.recentRequests.length === 0 ? (
              <p className="empty-state">
                {recent.available
                  ? "No requests yet."
                  : "Recent requests temporarily unavailable."}
              </p>
            ) : (
              <div className="dashboard-risk-list dashboard-card-body">
                {dashboard.recentRequests
                  .slice(0, DASHBOARD_CARD_ITEM_LIMIT)
                  .map((request) => (
                    <Link
                      className="dashboard-risk-row"
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
                      <ArrowRight />
                    </Link>
                  ))}
              </div>
            )}
            <PanelFooter href="/requests" />
          </section>

          <section
            className="panel dashboard-card compact-quick-actions"
            data-testid="dashboard-quick-actions"
          >
            <PanelHeading
              title="Quick Actions"
              subtitle="Common shortcuts for this role."
            />
            <div className="quick-action-list dashboard-card-body">
              {isAdmin ? (
                <>
                  <QuickAction
                    href="/inventory/new"
                    icon={<PlusCircle />}
                    title="Add Inventory Item"
                    description="Create a new stock record"
                    primary
                  />
                  <QuickAction
                    href="/requests"
                    icon={<ClipboardList />}
                    title="Review Requests"
                    description={`${dashboard.requests.pendingRequests} pending requests`}
                  />
                  <QuickAction
                    href="/inventory"
                    icon={<Package />}
                    title="Browse Inventory"
                    description="Check stock and low-stock items"
                  />
                  <QuickAction
                    href="/inventory?stock=out"
                    icon={<AlertTriangle />}
                    title="Resolve Stockouts"
                    description={`${urgent.alerts.outOfStock} out-of-stock items`}
                  />
                </>
              ) : (
                <>
                  <QuickAction
                    href="/requests/new"
                    icon={<PlusCircle />}
                    title="Create Request"
                    description="Ask for an inventory item"
                    primary
                  />
                  <QuickAction
                    href="/inventory"
                    icon={<PackageCheck />}
                    title="Browse Inventory"
                    description={`${dashboard.inventory.availableItems} available items`}
                  />
                  <QuickAction
                    href="/requests"
                    icon={<ClipboardList />}
                    title="Track Requests"
                    description={`${dashboard.requests.pendingRequests} pending requests`}
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
            <PanelFooter href={isAdmin ? "/inventory" : "/requests/new"} />
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
  label = "See more",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link className="panel-footer-link" href={href}>
      {label}
      <ArrowRight />
    </Link>
  );
}

function dashboardBadgeClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("out") || normalized.includes("overdue")) {
    return "badge-red";
  }
  if (
    normalized.includes("low") ||
    normalized.includes("soon") ||
    normalized.includes("pending")
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
    fulfilledRequests: 0,
    pendingRequests: 0,
    totalRequests: 0,
  },
};

const emptyUrgentData = {
  alerts: {
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
    requestCode: string;
    requesterName: string;
    risk: string;
  }>,
  recentActivity: [] as Array<{
    action: string;
    createdAt: Date | string;
    id: string;
    requestCode: string | null;
  }>,
};

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
