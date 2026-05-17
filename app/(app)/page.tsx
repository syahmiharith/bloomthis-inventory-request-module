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

export default async function HomePage() {
  const currentUser = await getCurrentUserForShell();
  const dashboard = emptyDashboardData;
  const urgent = emptyUrgentData;
  const isAdmin = currentUser.role === "admin";

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

        <KpiGrid testId="dashboard-summary-cards">
          {isAdmin ? (
            <>
              <KpiCard
                icon={<Package />}
                label="Total Items"
                value={dashboard.inventory.totalItems}
                note="Inventory records"
                tone="blue"
              />
              <KpiCard
                icon={<AlertTriangle />}
                label="Low Stock"
                value={dashboard.inventory.lowStockItems}
                note="At or below threshold"
                tone="amber"
              />
              <KpiCard
                icon={<ClipboardList />}
                label="Pending Requests"
                value={dashboard.requests.pendingRequests}
                note="Waiting for review"
                tone="red"
              />
              <KpiCard
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
                icon={<PackageCheck />}
                label="Available Items"
                value={dashboard.inventory.availableItems}
                note="Currently requestable"
                tone="blue"
              />
              <KpiCard
                icon={<ClipboardList />}
                label="My Requests"
                value={dashboard.requests.totalRequests}
                note={currentUser.name}
                tone="green"
              />
              <KpiCard
                icon={<AlertTriangle />}
                label="Pending Requests"
                value={dashboard.requests.pendingRequests}
                note="Awaiting admin review"
                tone="amber"
              />
              <KpiCard
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
          <section className="panel">
            <PanelHeading
              title="Priority Action Queue"
              subtitle="Highest-priority stock and request work."
            />
            <div className="dashboard-risk-list">
              {[
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
              ]
                .slice(0, 8)
                .map((entry) => (
                  <Link
                    className="dashboard-risk-row"
                    href={entry.href}
                    key={entry.href}
                  >
                    <span className="badge badge-amber">{entry.label}</span>
                    <strong>{entry.target}</strong>
                    <span>{entry.reason}</span>
                    <ArrowRight />
                  </Link>
                ))}
            </div>
          </section>

          <section className="panel" data-testid="dashboard-recent-requests">
            <PanelHeading
              title={isAdmin ? "Recent Requests" : "My Recent Requests"}
              subtitle={
                isAdmin
                  ? "Latest inventory requests across the company."
                  : "Latest requests for the current demo employee."
              }
            />
            {dashboard.recentRequests.length === 0 ? (
              <p className="empty-state">No requests yet.</p>
            ) : null}
          </section>

          <section
            className="panel compact-quick-actions"
            data-testid="dashboard-quick-actions"
          >
            <PanelHeading
              title="Quick Actions"
              subtitle="Common shortcuts for this role."
            />
            <div className="quick-action-list">
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
                </>
              )}
            </div>
          </section>

          <section className="panel">
            <PanelHeading
              title="Recent Activity"
              subtitle="Latest request and inventory events."
            />
            <div className="timeline-list">
              {urgent.recentActivity.map((entry) => (
                <article key={entry.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{entry.action.replaceAll("_", " ")}</strong>
                    <p>{entry.requestCode ?? "Inventory activity"}</p>
                  </div>
                  <time>{formatDate(entry.createdAt)}</time>
                </article>
              ))}
            </div>
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

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
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
    createdAt: Date;
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
    createdAt: Date;
    id: string;
    requestCode: string | null;
  }>,
};
