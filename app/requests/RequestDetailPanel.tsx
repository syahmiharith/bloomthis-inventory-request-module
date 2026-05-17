import { StatusBadge } from "@/components/ui/StatusBadge";
import type { RequestStatus } from "@/lib/constants";
import { StatusActionForm } from "./StatusActionForm";
import { updateRequestDetailStatusAction } from "./[id]/actions";

type RequestDetail = Awaited<
  ReturnType<typeof import("@/services/request.service").getRequestById>
>;

export function RequestDetailPanel({
  isAdmin,
  query,
  request,
}: {
  isAdmin: boolean;
  query?: { error?: string; success?: string };
  request: RequestDetail;
}) {
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
    <div className="panel-detail-stack" data-testid="request-detail-panel">
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

      <section className="panel">
        <div className="panel-header stacked-panel-header">
          <div>
            <h3>Request Summary</h3>
            <p>Current status and requester information.</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
        <dl className="details-grid panel-details-grid">
          <div>
            <dt>Request</dt>
            <dd>{request.requestCode}</dd>
          </div>
          <div>
            <dt>Requester</dt>
            <dd>{request.requesterName}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{capitalize(request.status)}</dd>
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
                <th>Current</th>
                <th>Requested</th>
                <th>After</th>
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
                      {after >= 0 ? (
                        after
                      ) : (
                        <span className="badge badge-red">Insufficient</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin ? (
        <section className="panel">
          <div className="panel-header stacked-panel-header">
            <div>
              <h3>Admin Actions</h3>
              <p>Server-validated before stock changes.</p>
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
                Fulfillment is disabled because one or more requested items do
                not have enough available stock.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

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
          <div className="audit-list panel-audit-list">
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
    </div>
  );
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
        <StatusActionForm
          action={updateRequestDetailStatusAction}
          requestId={requestId}
          status="approved"
          label="Approve"
        />
        <StatusActionForm
          action={updateRequestDetailStatusAction}
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
      <StatusActionForm
        action={updateRequestDetailStatusAction}
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
