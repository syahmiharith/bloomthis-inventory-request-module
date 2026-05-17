import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import type { RequestStatus } from "@/lib/constants";
import { listRequests } from "@/services/request.service";
import { updateRequestStatusAction } from "./actions";
import { StatusActionForm } from "./StatusActionForm";

type RequestsPageProps = {
  searchParams?: Promise<{
    category?: string;
    error?: string;
    q?: string;
    status?: string;
    success?: string;
  }>;
};

const requestStatuses: RequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
];

export default async function RequestsPage({
  searchParams,
}: RequestsPageProps) {
  const params = (await searchParams) ?? {};
  const currentUser = await getCurrentUser();
  const selectedStatus = requestStatuses.includes(
    params.status as RequestStatus,
  )
    ? (params.status as RequestStatus)
    : undefined;
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedCategory = params.category?.trim() ?? "";
  const requests = await listRequests(
    selectedStatus ? { status: selectedStatus } : {},
    currentUser,
  );
  const isAdmin = currentUser.role === "admin";
  const categories = Array.from(
    new Set(requests.flatMap((request) => request.items.map((item) => item.itemCategory))),
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
    <main
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section data-testid="requests-page">
        <div className="route-heading">
          <div>
            <h2>Requests</h2>
            <p>
              {isAdmin
                ? "Review inventory requests and fulfill approved requests."
                : "Track your demo-user inventory requests."}
            </p>
          </div>
          {!isAdmin ? (
            <Link
              className="button button-primary actions"
              href="/requests/new"
            >
              <PlusCircle size={16} />
              Create Request
            </Link>
          ) : null}
        </div>

        {params.success ? (
          <p aria-live="polite" className="alert alert-success">
            {params.success}
          </p>
        ) : null}

        {params.error ? (
          <p aria-live="polite" className="alert alert-error">
            {params.error}
          </p>
        ) : null}

        <section className="panel">
          <form action="/requests" className="stock-toolbar">
            <label className="search-field">
              <span className="sr-only">Search requests</span>
              <Search />
              <input
                className="input"
                defaultValue={params.q ?? ""}
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
          </form>

          {filteredRequests.length === 0 ? (
            <div className="empty-state-card">
              <p>
                {isAdmin
                  ? "No employee requests match this view. New employee requests will appear here."
                  : "You have no demo-user requests in this view."}
              </p>
              {!isAdmin ? (
                <Link className="button button-primary" href="/requests/new">
                  Create Request
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="table-wrap compact">
              <table>
                <thead>
                  <tr>
                    <th>Request</th>
                    {isAdmin ? <th>Requester</th> : null}
                    <th>Items</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    {isAdmin ? <th>Stock</th> : null}
                    <th>Created</th>
                    <th>Action</th>
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
                    const fulfillPreview = request.items
                      .map(
                        (item) =>
                          `${item.itemName}: ${item.availableQuantity} -> ${
                            item.availableQuantity - item.requestedQuantity
                          }`,
                      )
                      .join("\n");

                    return (
                      <tr key={request.id}>
                        <td className="mono-cell">{request.requestCode}</td>
                        {isAdmin ? <td>{request.requesterName}</td> : null}
                        <td>
                          {request.items
                            .map((item) => item.itemName)
                            .join(", ")}
                        </td>
                        <td className="numeric-cell">{totalQuantity}</td>
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        {isAdmin ? (
                          <td>
                            <StockSummary
                              canFulfill={canFulfill}
                              status={request.status}
                            />
                          </td>
                        ) : null}
                        <td>{formatDate(request.createdAt)}</td>
                        <td>
                          <div className="button-row table-actions">
                            <Link
                              className="inline-link"
                              href={`/requests/${request.id}`}
                            >
                              View
                            </Link>
                            {isAdmin ? (
                              <AdminRequestActions
                                canFulfill={canFulfill}
                                fulfillPreview={fulfillPreview}
                                requestId={request.id}
                                status={request.status}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function AdminRequestActions({
  canFulfill,
  fulfillPreview,
  requestId,
  status,
}: {
  canFulfill: boolean;
  fulfillPreview: string;
  requestId: string;
  status: RequestStatus;
}) {
  if (status === "pending") {
    return (
      <>
        <StatusActionForm
          action={updateRequestStatusAction}
          requestId={requestId}
          status="approved"
          label="Approve"
        />
        <StatusActionForm
          action={updateRequestStatusAction}
          requestId={requestId}
          status="rejected"
          label="Reject"
          variant="danger"
        />
      </>
    );
  }

  if (status === "approved") {
    return (
      <StatusActionForm
        action={updateRequestStatusAction}
        disabled={!canFulfill}
        disabledReason="Insufficient stock for fulfillment."
        fulfillPreview={fulfillPreview}
        requestId={requestId}
        status="fulfilled"
        label="Fulfill"
      />
    );
  }

  return null;
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
