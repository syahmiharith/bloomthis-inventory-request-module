import Link from "next/link";
import { notFound } from "next/navigation";
import type { RequestStatus } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { getRequestById } from "@/services/request.service";
import { StatusActionForm } from "../StatusActionForm";
import { updateRequestDetailStatusAction } from "./actions";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function RequestDetailPage({
  params,
  searchParams,
}: RequestDetailPageProps) {
  const [{ id }, query, currentUser] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const request = await getRequestOrNotFound(id, currentUser);
  const isAdmin = currentUser.role === "admin";
  const totalQuantity = request.items.reduce(
    (sum, item) => sum + item.requestedQuantity,
    0,
  );
  const canFulfill =
    request.status === "approved" &&
    request.items.every(
      (item) => item.availableQuantity >= item.requestedQuantity,
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
    <main
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section data-testid="request-detail-page">
        <div className="route-heading">
          <div>
            <h2>{request.requestCode}</h2>
            <p>Request details, stock impact, and status history.</p>
          </div>
          <Link className="button button-secondary" href="/requests">
            Back to requests
          </Link>
        </div>

        {query?.success ? (
          <p aria-live="polite" className="alert alert-success">
            {query.success}
          </p>
        ) : null}

        {query?.error ? (
          <p aria-live="polite" className="alert alert-error">
            {query.error}
          </p>
        ) : null}

        <div className="dashboard-grid refined-dashboard-grid">
          <section className="panel">
            <div className="panel-header stacked-panel-header">
              <div>
                <h3>Request Summary</h3>
                <p>Current status and requester information.</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <dl className="details-grid">
              <div>
                <dt>Requester</dt>
                <dd>{request.requesterName}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{capitalize(request.status)}</dd>
              </div>
              <div>
                <dt>Item</dt>
                <dd>{request.items.map((item) => item.itemName).join(", ")}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{totalQuantity}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(request.createdAt)}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{request.reason}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="panel-header stacked-panel-header">
              <div>
                <h3>Inventory Impact</h3>
                <p>Current stock and fulfillment preview.</p>
              </div>
            </div>
            <div className="table-wrap compact">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Current stock</th>
                    <th>Requested</th>
                    <th>After fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item) => {
                    const after =
                      item.availableQuantity - item.requestedQuantity;
                    return (
                      <tr key={item.id}>
                        <td>{item.itemName}</td>
                        <td className="numeric-cell">
                          {item.availableQuantity}
                        </td>
                        <td className="numeric-cell">
                          {item.requestedQuantity}
                        </td>
                        <td className="numeric-cell">
                          {after >= 0 ? (
                            after
                          ) : (
                            <span className="badge badge-red">
                              Insufficient stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header stacked-panel-header">
              <div>
                <h3>Request History</h3>
                <p>Status and creation events for this request.</p>
              </div>
            </div>
            {request.requestHistory.length === 0 ? (
              <p className="empty-state">No history yet.</p>
            ) : (
              <div className="audit-list">
                {request.requestHistory.map((entry) => (
                  <div key={entry.id}>
                    <strong>{humanize(entry.action)}</strong>
                    <span>
                      {entry.actorName} · {entry.actorRole}
                      {entry.fromStatus || entry.toStatus
                        ? ` · ${entry.fromStatus ?? "new"} to ${entry.toStatus ?? "none"}`
                        : ""}
                    </span>
                    {entry.note ? <span>{entry.note}</span> : null}
                    <time>{formatDateTime(entry.createdAt)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isAdmin ? (
            <section className="panel">
              <div className="panel-header stacked-panel-header">
                <div>
                  <h3>Admin Actions</h3>
                  <p>Actions are server-validated before any stock changes.</p>
                </div>
              </div>
              <div className="admin-controls">
                <AdminActions
                  canFulfill={canFulfill}
                  fulfillPreview={fulfillPreview}
                  requestId={request.id}
                  status={request.status}
                />
                {request.status === "approved" && !canFulfill ? (
                  <p className="alert alert-error">
                    Fulfillment is disabled because one or more requested items
                    do not have enough available stock.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

async function getRequestOrNotFound(
  id: string,
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  try {
    return await getRequestById(id, currentUser);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

function AdminActions({
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
      <div className="button-row">
        <StatusForm requestId={requestId} status="approved" label="Approve" />
        <StatusForm
          requestId={requestId}
          status="rejected"
          label="Reject"
          variant="danger"
        />
      </div>
    );
  }

  if (status === "approved") {
    return (
      <StatusForm
        disabled={!canFulfill}
        disabledReason="Insufficient stock for fulfillment."
        fulfillPreview={fulfillPreview}
        requestId={requestId}
        status="fulfilled"
        label="Fulfill"
      />
    );
  }

  return <p className="empty-state">No actions available for this status.</p>;
}

function StatusForm({
  disabled = false,
  disabledReason,
  fulfillPreview,
  label,
  requestId,
  status,
  variant = "secondary",
}: {
  disabled?: boolean;
  disabledReason?: string;
  fulfillPreview?: string;
  label: string;
  requestId: string;
  status: RequestStatus;
  variant?: "secondary" | "danger";
}) {
  return (
    <StatusActionForm
      action={updateRequestDetailStatusAction}
      disabled={disabled}
      disabledReason={disabledReason}
      fulfillPreview={fulfillPreview}
      label={label}
      requestId={requestId}
      status={status}
      variant={variant}
    />
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanize(value: string) {
  return value.split("_").map(capitalize).join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
