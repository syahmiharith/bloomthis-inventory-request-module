import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/table/Pagination";
import { ColumnResizeHandle } from "@/components/ui/table/ResizableDataTable";
import { SortHeader, sortAria } from "@/components/ui/table/SortHeader";
import { StatusBadge } from "@/components/ui/badges/StatusBadge";
import type { User } from "@/db/schema";
import type { RequestStatus } from "@/lib/constants";
import { listRequests } from "@/features/requests/services/request.service";
import { RequestCreateModalButton } from "./RequestCreateModalButton";

export type RequestWorkspaceSearchParams = {
  category?: string;
  dir?: string;
  error?: string;
  page?: string;
  q?: string;
  sort?: string;
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
const requestSortKeys = [
  "request",
  "requester",
  "items",
  "quantity",
  "status",
  "stock",
  "created",
  "requiredBy",
] as const;
const sortDirections = ["asc", "desc"] as const;
const requestTableColumns = [
  { id: "request", defaultWidth: 180, minWidth: 140 },
  { id: "requester", defaultWidth: 230, minWidth: 170 },
  { id: "items", defaultWidth: 360, minWidth: 220 },
  { id: "quantity", defaultWidth: 92, minWidth: 76 },
  { id: "status", defaultWidth: 140, minWidth: 120 },
  { id: "stock", defaultWidth: 170, minWidth: 140 },
  { id: "created", defaultWidth: 120, minWidth: 100 },
  { id: "action", defaultWidth: 48, minWidth: 44 },
];
type RequestRow = Awaited<ReturnType<typeof listRequests>>["rows"][number];
type RequestItemRow = RequestRow["items"][number];

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
  const query = searchParams.q?.trim() ?? "";
  const selectedCategory = searchParams.category?.trim() ?? "";
  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const selectedSort = requestSortKeys.includes(
    searchParams.sort as (typeof requestSortKeys)[number],
  )
    ? (searchParams.sort as (typeof requestSortKeys)[number])
    : "created";
  const selectedDir = sortDirections.includes(
    searchParams.dir as (typeof sortDirections)[number],
  )
    ? (searchParams.dir as (typeof sortDirections)[number])
    : "desc";
  const requestResult = await listRequests(
    {
      category: selectedCategory,
      dir: selectedDir,
      page: currentPage,
      pageSize,
      q: query,
      sort: selectedSort,
      status: selectedStatus,
    },
    currentUser,
  );
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
                <RequestCreateModalButton requesterName={currentUser.name} />
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
                {query ||
                selectedStatus ||
                selectedCategory ||
                searchParams.sort ? (
                  <Link className="clear-filter-link" href="/requests">
                    Clear filters
                  </Link>
                ) : null}
              </DataToolbar>
            </form>
            <p className="list-count-meta">
              Showing {pagedRequests.length} of {requestResult.totalCount}{" "}
              request rows · filters{" "}
              {formatFilterSummary({
                category: selectedCategory,
                q: query,
                status: selectedStatus ?? "",
              })}
            </p>

            {requestResult.totalCount === 0 ? (
              <EmptyState
                action={
                  !isAdmin ? (
                    <RequestCreateModalButton
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
              <DataTable
                className="requests-table"
                columns={requestTableColumns}
                tableId="requests-table"
              >
                <thead>
                  <tr>
                    <th
                      aria-sort={sortAria("request", selectedSort, selectedDir)}
                      className="col-code"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Request"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="request"
                      />
                      <ColumnResizeHandle
                        columnId="request"
                        minWidth={140}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria(
                        "requester",
                        selectedSort,
                        selectedDir,
                      )}
                      className="col-person"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Requester"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="requester"
                      />
                      <ColumnResizeHandle
                        columnId="requester"
                        minWidth={170}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("items", selectedSort, selectedDir)}
                      className="col-items"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Items"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="items"
                      />
                      <ColumnResizeHandle
                        columnId="items"
                        minWidth={220}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria(
                        "quantity",
                        selectedSort,
                        selectedDir,
                      )}
                      className="col-number"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Qty"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="quantity"
                      />
                      <ColumnResizeHandle
                        columnId="quantity"
                        minWidth={76}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("status", selectedSort, selectedDir)}
                      className="col-status"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Status"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="status"
                      />
                      <ColumnResizeHandle
                        columnId="status"
                        minWidth={120}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("stock", selectedSort, selectedDir)}
                      className="col-stock hide-md"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Stock"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="stock"
                      />
                      <ColumnResizeHandle
                        columnId="stock"
                        minWidth={140}
                        tableId="requests-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("created", selectedSort, selectedDir)}
                      className="col-date hide-md"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/requests"
                        label="Created"
                        params={{
                          category: selectedCategory,
                          q: query,
                          status: selectedStatus ?? "",
                        }}
                        sortKey="created"
                      />
                      <ColumnResizeHandle
                        columnId="created"
                        minWidth={100}
                        tableId="requests-table"
                      />
                    </th>
                    <th className="col-action">
                      <span className="sr-only">Open details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRequests.map((request) => {
                    const totalQuantity = request.items.reduce(
                      (sum, item) => sum + item.requestedQuantity,
                      0,
                    );
                    return (
                      <ClickableRow
                        href={`/requests/${request.id}`}
                        key={request.id}
                        selected={selectedRequestId === request.id}
                      >
                        <td className="request-code-cell">
                          <strong className="mono-cell">
                            {request.requestCode}
                          </strong>
                          <span className="cell-subtext">
                            Due {formatDate(request.requiredBy)} ·{" "}
                            {capitalize(request.priority)}
                          </span>
                        </td>
                        <td title={request.requesterName}>
                          <RequesterCell
                            department={request.department}
                            name={request.requesterName}
                          />
                        </td>
                        <td title={formatItemTitle(request.items)}>
                          <RequestItemChips items={request.items} />
                        </td>
                        <td className="numeric-cell">{totalQuantity}</td>
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="hide-md">
                          <StockSummary
                            items={request.items}
                            status={request.status}
                          />
                        </td>
                        <td className="hide-md">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="row-chevron-cell">
                          <ChevronRight aria-hidden="true" />
                        </td>
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
                  dir: selectedDir,
                  q: query,
                  sort: selectedSort,
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

function StockSummary({
  items,
  status,
}: {
  items: RequestItemRow[];
  status: RequestStatus;
}) {
  if (status === "fulfilled") {
    return <span className="badge badge-stock-issued">Issued</span>;
  }

  if (status === "rejected") {
    return <span className="badge badge-stock-closed">Closed</span>;
  }

  if (items.length === 0) {
    return <span className="badge badge-stock-closed">No items</span>;
  }

  const shortItems = items.filter(
    (item) => item.availableQuantity < item.requestedQuantity,
  );

  if (shortItems.length === 0) {
    return <span className="badge badge-stock-ready">Enough stock</span>;
  }

  if (shortItems.length === items.length) {
    return (
      <span className="badge badge-stock-insufficient">Insufficient stock</span>
    );
  }

  return (
    <span className="badge badge-stock-partial">
      {shortItems.length} item{shortItems.length === 1 ? "" : "s"} short
    </span>
  );
}

function RequestItemChips({ items }: { items: RequestItemRow[] }) {
  const visibleItems = items.slice(0, 2);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);

  if (items.length === 0) {
    return <span className="muted">No items</span>;
  }

  return (
    <span className="item-chip-list">
      {visibleItems.map((item) => (
        <span className="item-chip" key={item.id}>
          <span>{item.itemName}</span>
          <small>
            {item.requestedQuantity} {item.unit}
          </small>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="item-chip-more">+{hiddenCount} more</span>
      ) : null}
    </span>
  );
}

function formatItemTitle(items: RequestItemRow[]) {
  return items
    .map((item) => `${item.itemName} (${item.requestedQuantity} ${item.unit})`)
    .join(", ");
}

function RequesterCell({
  department,
  name,
}: {
  department: string;
  name: string;
}) {
  return (
    <span className="requester-cell">
      <span aria-hidden="true" className="portrait-avatar">
        {initials(name)}
      </span>
      <span className="requester-meta">
        <strong>{name}</strong>
        <small>{department}</small>
      </span>
    </span>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
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

function formatFilterSummary(filters: Record<string, string>) {
  const active = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`);
  return active.length > 0 ? active.join(", ") : "none";
}
