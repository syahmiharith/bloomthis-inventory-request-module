import Link from "next/link";
import { notFound } from "next/navigation";
import type { RequestStatus } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { getRequestById } from "@/services/request.service";
import { updateRequestDetailStatusAction } from "./actions";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
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

        {query?.error ? <p className="alert alert-error">{query.error}</p> : null}

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
                    const after = item.availableQuantity - item.requestedQuantity;
                    return (
                      <tr key={item.id}>
                        <td>{item.itemName}</td>
                        <td className="numeric-cell">{item.availableQuantity}</td>
                        <td className="numeric-cell">{item.requestedQuantity}</td>
                        <td className="numeric-cell">
                          {after >= 0 ? after : "Insufficient stock"}
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
                <AdminActions requestId={request.id} status={request.status} />
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
  requestId,
  status,
}: {
  requestId: string;
  status: RequestStatus;
}) {
  if (status === "pending") {
    return (
      <div className="button-row">
        <StatusForm requestId={requestId} status="approved" label="Approve" />
        <StatusForm
          adminComment="Rejected from request detail."
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
      <StatusForm requestId={requestId} status="fulfilled" label="Fulfill" />
    );
  }

  return <p className="empty-state">No actions available for this status.</p>;
}

function StatusForm({
  adminComment,
  label,
  requestId,
  status,
  variant = "secondary",
}: {
  adminComment?: string;
  label: string;
  requestId: string;
  status: RequestStatus;
  variant?: "secondary" | "danger";
}) {
  return (
    <form action={updateRequestDetailStatusAction}>
      <input name="requestId" type="hidden" value={requestId} />
      <input name="status" type="hidden" value={status} />
      {adminComment ? (
        <input name="adminComment" type="hidden" value={adminComment} />
      ) : null}
      <button className={`button button-${variant}`} type="submit">
        {label}
      </button>
    </form>
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
