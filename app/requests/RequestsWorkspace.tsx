import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { User } from "@/db/schema";
import type { RequestStatus } from "@/lib/constants";
import { listRequestableItems } from "@/services/item.service";
import { listRequests } from "@/services/request.service";
import { RequestCreateModalButton } from "./RequestCreateModalButton";

export type RequestWorkspaceSearchParams = {
  category?: string;
  error?: string;
  page?: string;
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
const pageSize = 25;

export async function RequestsWorkspace({
  currentUser,
  overlay,
  panel,
  panelFooter,
  selectedRequestId,
  searchParams,
}: {
  currentUser: User;
  overlay?: React.ReactNode;
  panel?: React.ReactNode;
  panelFooter?: React.ReactNode;
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
  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const [requestResult, inventoryItems] = await Promise.all([
    listRequests(
      {
        category: selectedCategory,
        page: currentPage,
        pageSize,
        q: query,
        status: selectedStatus,
      },
      currentUser,
    ),
    listRequestableItems(),
  ]);
  const isAdmin = currentUser.role === "admin";
  const categories = requestResult.categories;
  const pagedRequests = requestResult.rows;
  const selectedOutsideFilters =
    selectedRequestId !== undefined &&
    !pagedRequests.some((request) => request.id === selectedRequestId);

  return (
    <WorkspaceLayout
      sidePanel={
        panel
          ? {
              children: panel,
              closeHref: "/requests",
              footer: panelFooter,
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
                <RequestCreateModalButton
                  items={inventoryItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    category: item.category,
                    available: item.available,
                  }))}
                  requesterName={currentUser.name}
                />
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
          {selectedOutsideFilters ? (
            <p aria-live="polite" className="alert alert-info">
              The selected request is outside the current page or filters. Clear
              filters or change pages to show it in the table.
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

            {requestResult.totalCount === 0 ? (
              <EmptyState
                action={
                  !isAdmin ? (
                    <RequestCreateModalButton
                      items={inventoryItems.map((item) => ({
                        id: item.id,
                        name: item.name,
                        sku: item.sku,
                        category: item.category,
                        available: item.available,
                      }))}
                      requesterName={currentUser.name}
                    />
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
                    {pagedRequests.map((request) => {
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
            {requestResult.totalCount > pageSize ? (
              <Pagination
                basePath="/requests"
                page={requestResult.page}
                pageCount={requestResult.pageCount}
                searchParams={{
                  category: selectedCategory,
                  q: query,
                  status: selectedStatus ?? "",
                }}
              />
            ) : null}
          </section>
        </section>
        {overlay}
      </main>
    </WorkspaceLayout>
  );
}

function Pagination({
  basePath,
  page,
  pageCount,
  searchParams,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  searchParams: Record<string, string>;
}) {
  return (
    <div className="pagination-row">
      <span>
        Page {page} of {pageCount}
      </span>
      <div>
        <Link
          aria-disabled={page <= 1}
          className="button button-secondary button-compact"
          href={pageHref(basePath, searchParams, page - 1)}
        >
          Previous
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className="button button-secondary button-compact"
          href={pageHref(basePath, searchParams, page + 1)}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function pageHref(
  basePath: string,
  searchParams: Record<string, string>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(Math.max(1, page)));
  return `${basePath}?${params.toString()}`;
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
