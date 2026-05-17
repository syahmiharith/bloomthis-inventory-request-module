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
import { getCurrentUser } from "@/lib/auth";
import type { RequestStatus } from "@/lib/constants";
import { getDashboardPageData } from "@/services/dashboard.service";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { KpiCard, KpiGrid } from "@/components/ui/Kpi";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const dashboard = await getDashboardPageData(currentUser);
  const isAdmin = currentUser.role === "admin";

  return (
    <main
      className="page-scroll main-scroll-region route-page dashboard-route"
      data-testid="main-scroll-region"
    >
      <section data-testid="dashboard-page">
        <div className="route-heading dashboard-heading">
          <div>
            <h2>{isAdmin ? "Inventory Dashboard" : "My Inventory Requests"}</h2>
            <p>
              {isAdmin
                ? "Monitor stock, pending requests, and recent request activity."
                : "Browse available inventory and track your demo-user requests."}
            </p>
          </div>
        </div>

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
            ) : (
              <div className="table-wrap compact dashboard-table">
                <table className="data-table dashboard-table-content">
                  <thead>
                    <tr>
                      <th className="col-code">Request</th>
                      {isAdmin ? <th className="col-person">Requester</th> : null}
                      <th className="col-items">Items</th>
                      <th className="col-number">Qty</th>
                      <th className="col-status">Status</th>
                      <th className="col-date hide-md">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentRequests.map((request) => (
                      <ClickableRow href={`/requests/${request.id}`} key={request.id}>
                        <td className="mono-cell truncate-cell" title={request.requestCode}>
                          {request.requestCode}
                        </td>
                        {isAdmin ? (
                          <td className="truncate-cell" title={request.requesterName}>
                            {request.requesterName}
                          </td>
                        ) : null}
                        <td className="truncate-cell" title={request.itemNames}>
                          {request.itemNames}
                        </td>
                        <td>{request.quantityRequested}</td>
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="hide-md">{formatDate(request.createdAt)}</td>
                      </ClickableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

function StatusBadge({ status }: { status: RequestStatus }) {
  const tone =
    status === "fulfilled"
      ? "badge-green"
      : status === "approved"
        ? "badge-blue"
        : status === "rejected"
          ? "badge-red"
          : "badge-amber";
  return <span className={`badge ${tone}`}>{capitalize(status)}</span>;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
