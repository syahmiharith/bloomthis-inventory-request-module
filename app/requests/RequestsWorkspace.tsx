import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { User } from "@/db/schema";
import type { RequestStatus } from "@/lib/constants";
import { listRequests } from "@/services/request.service";

export type RequestWorkspaceSearchParams = {
  category?: string;
  error?: string;
  q?: string;
  status?: string;
  success?: string;
};

const requestStatuses: RequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
];

export async function RequestsWorkspace({
  currentUser,
  overlay,
  panel,
  selectedRequestId,
  searchParams,
}: {
  currentUser: User;
  overlay?: React.ReactNode;
  panel?: React.ReactNode;
  selectedRequestId?: string;
  searchParams: RequestWorkspaceSearchParams;
}) {
  const selectedStatus = requestStatuses.includes(
    searchParams.status as RequestStatus,
  )
    ? (searchParams.status as RequestStatus)
    : undefined;
  const query = searchParams.q?.trim().toLowerCase() ?? "";
  const selectedCategory = searchParams.category?.trim() ?? "";
  const requests = await listRequests(
    selectedStatus ? { status: selectedStatus } : {},
    currentUser,
  );
  const isAdmin = currentUser.role === "admin";
  const categories = Array.from(
    new Set(
      requests.flatMap((request) =>
        request.items.map((item) => item.itemCategory),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const filteredRequests = requests.filter((request) => {
    const matchesQuery =
      query.length === 0 ||
      request.requestCode.toLowerCase().includes(query) ||
      request.requesterName.toLowerCase().includes(query) ||
      request.items.some((item) => item.itemName.toLowerCase().includes(query));
    const matchesCategory =
      selectedCategory.length === 0 ||
      request.items.some((item) => item.itemCategory === selectedCategory);
    return matchesQuery && matchesCategory;
  });

  return (
    <WorkspaceLayout
      sidePanel={
        panel
          ? {
              children: panel,
              closeHref: "/requests",
              title: "Request Details",
            }
          : undefined
      }
    >
      <main
        className="page-scroll main-scroll-region route-page"
        data-testid="main-scroll-region"
      >
        <section data-testid="requests-page">
          <PageHeader
            title="Requests"
            description={
              isAdmin
                ? "Review inventory requests and fulfill approved requests."
                : "Track your demo-user inventory requests."
            }
            actions={
              !isAdmin ? (
              <Link
                className="button button-primary actions"
                href="/requests/new"
              >
                <PlusCircle size={16} />
                Create Request
              </Link>
              ) : null
            }
          />

          {searchParams.success ? (
            <p aria-live="polite" className="alert alert-success">
              {searchParams.success}
            </p>
          ) : null}

          {searchParams.error ? (
            <p aria-live="polite" className="alert alert-error">
              {searchParams.error}
            </p>
          ) : null}

          <section className="panel">
            <form action="/requests">
              <DataToolbar>
              <label className="search-field">
                <span className="sr-only">Search requests</span>
                <Search />
                <input
                  className="input"
                  defaultValue={searchParams.q ?? ""}
                  name="q"
                  placeholder="Search code, requester, or item"
                  type="search"
                />
              </label>
              <label className="filter-select">
                <span>Status</span>
                <select defaultValue={selectedStatus ?? ""} name="status">
                  <option value="">All statuses</option>
                  {requestStatuses.map((status) => (
                    <option key={status} value={status}>
                      {capitalize(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-select">
                <span>Category</span>
                <select defaultValue={selectedCategory} name="category">
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">
                Filter
              </button>
              {query || selectedStatus || selectedCategory ? (
                <Link className="clear-filter-link" href="/requests">
                  Clear filters
                </Link>
              ) : null}
              </DataToolbar>
            </form>

            {filteredRequests.length === 0 ? (
              <EmptyState
                action={
                  !isAdmin ? (
                  <Link className="button button-primary" href="/requests/new">
                    Create Request
                  </Link>
                  ) : null
                }
              >
                {isAdmin
                  ? "No employee requests match this view. New employee requests will appear here."
                  : "You have no demo-user requests in this view."}
              </EmptyState>
            ) : (
              <DataTable className="requests-table">
                  <thead>
                    <tr>
                      <th className="col-code">Request</th>
                      {isAdmin ? <th className="col-person">Requester</th> : null}
                      <th className="col-items">Items</th>
                      <th className="col-number">Quantity</th>
                      <th className="col-status">Status</th>
                      {isAdmin ? <th className="col-stock hide-md">Stock</th> : null}
                      <th className="col-date hide-md">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const totalQuantity = request.items.reduce(
                        (sum, item) => sum + item.requestedQuantity,
                        0,
                      );
                      const canFulfill =
                        request.status === "approved" &&
                        request.items.every(
                          (item) =>
                            item.availableQuantity >= item.requestedQuantity,
                        );
                      return (
                        <ClickableRow
                          href={`/requests/${request.id}`}
                          key={request.id}
                          selected={selectedRequestId === request.id}
                        >
                          <td className="mono-cell truncate-cell" title={request.requestCode}>
                            {request.requestCode}
                          </td>
                          {isAdmin ? (
                            <td className="truncate-cell" title={request.requesterName}>
                              {request.requesterName}
                            </td>
                          ) : null}
                          <td
                            className="truncate-cell"
                            title={request.items
                              .map((item) => item.itemName)
                              .join(", ")}
                          >
                            {request.items.map((item) => item.itemName).join(", ")}
                          </td>
                          <td className="numeric-cell">{totalQuantity}</td>
                          <td>
                            <StatusBadge status={request.status} />
                          </td>
                          {isAdmin ? (
                            <td className="hide-md">
                              <StockSummary
                                canFulfill={canFulfill}
                                status={request.status}
                              />
                            </td>
                          ) : null}
                          <td className="hide-md">{formatDate(request.createdAt)}</td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
              </DataTable>
            )}
          </section>
        </section>
        {overlay}
      </main>
    </WorkspaceLayout>
  );
}

function StockSummary({
  canFulfill,
  status,
}: {
  canFulfill: boolean;
  status: RequestStatus;
}) {
  if (status !== "approved") {
    return <span className="muted">Not applicable</span>;
  }

  return canFulfill ? (
    <span className="badge badge-green">Enough stock</span>
  ) : (
    <span className="badge badge-red">Insufficient stock</span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
