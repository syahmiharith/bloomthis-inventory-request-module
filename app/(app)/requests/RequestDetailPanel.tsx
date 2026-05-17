import { StatusBadge } from "@/components/ui/StatusBadge";
import type { RequestStatus } from "@/lib/constants";
import { StatusActionForm } from "./StatusActionForm";
import { updateRequestDetailStatusAction } from "./[id]/actions";
import type { ReactNode } from "react";

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
  const stockReadiness = getStockReadinessSummary(request);
  const nextAction = getNextActionSummary(request.status, stockReadiness);

  return (
    <div className="request-detail-sheet" data-testid="request-detail-panel">
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

      <section className="request-detail-hero" aria-labelledby="request-title">
        <div className="request-detail-hero-top">
          <div className="request-detail-title">
            <span className="eyebrow">Inventory request</span>
            <h3 id="request-title">{request.requestCode}</h3>
            <p>Created {formatDateTime(request.createdAt)}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="requester-summary-card">
          <div>
            <span>Requester</span>
            <strong>{request.requesterName}</strong>
            <p>
              {request.department} · {request.warehouse}
            </p>
          </div>
          <span className={stockReadiness.className}>{stockReadiness.label}</span>
        </div>

        <dl className="request-hero-metrics">
          <div>
            <dt>Total quantity</dt>
            <dd>{totalQuantity}</dd>
          </div>
          <div>
            <dt>Items</dt>
            <dd>{request.items.length}</dd>
          </div>
          <div>
            <dt>Next action</dt>
            <dd>{nextAction}</dd>
          </div>
        </dl>
      </section>

      <section className="request-reason-card">
        <span>Reason</span>
        <p title={request.reason}>{request.reason}</p>
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <div>
            <h3>Inventory impact</h3>
            <p>Current stock and fulfillment preview.</p>
          </div>
        </div>
        <div className="request-impact-list">
          {request.items.map((item) => {
            const after = item.availableQuantity - item.requestedQuantity;
            const itemIsShort = after < 0;
            return (
              <article
                className={`request-impact-card ${itemIsShort ? "is-short" : ""}`}
                key={item.id}
              >
                <div>
                  <strong>{item.itemName}</strong>
                  <span>
                    {item.itemSku} · {item.itemCategory}
                  </span>
                </div>
                <div className="request-impact-numbers">
                  <ImpactNumber label="Current" value={item.availableQuantity} />
                  <ImpactNumber label="Requested" value={item.requestedQuantity} />
                  <ImpactNumber
                    label="After"
                    value={
                      itemIsShort ? (
                        <span className="badge badge-stock-insufficient">
                          Short
                        </span>
                      ) : (
                        after
                      )
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <div>
            <h3>Request history</h3>
            <p>Status and creation events for this request.</p>
          </div>
        </div>
        {request.requestHistory.length === 0 ? (
          <p className="empty-state">No history yet.</p>
        ) : (
          <div className="request-history-list">
            {request.requestHistory.map((entry) => (
              <article
                className={`request-history-card ${timelineTone(entry.action)}`}
                key={entry.id}
              >
                <span className="timeline-dot" />
                <div>
                  <strong>{humanize(entry.action)}</strong>
                  <p>{formatHistoryMeta(entry)}</p>
                  <time>{formatDateTime(entry.createdAt)}</time>
                  {entry.note ? <span className="history-note">{entry.note}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function RequestDetailFooter({
  isAdmin,
  request,
}: {
  isAdmin: boolean;
  request: RequestDetail;
}) {
  if (!isAdmin) {
    return <p className="muted">Only admins can update request status.</p>;
  }

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
    <div className="request-action-footer">
      <AdminActions
        canFulfill={canFulfill}
        fulfillPreview={fulfillPreview}
        requestId={request.id}
        status={request.status}
      />
      {request.status === "approved" && !canFulfill ? (
        <p className="alert alert-error">
          Fulfillment is disabled because one or more requested items do not
          have enough available stock.
        </p>
      ) : null}
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
      <div className="request-action-buttons">
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
      <div className="request-action-buttons">
        <StatusActionForm
          action={updateRequestDetailStatusAction}
          disabled={!canFulfill}
          disabledReason="Insufficient stock for fulfillment."
          fulfillPreview={fulfillPreview}
          requestId={requestId}
          status="fulfilled"
          label="Fulfill"
        />
      </div>
    );
  }

  return <p className="empty-state">No actions available for this status.</p>;
}

function ImpactNumber({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="impact-number">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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

function timelineTone(action: string) {
  if (action.includes("approved")) return "is-approved";
  if (action.includes("rejected")) return "is-rejected";
  if (action.includes("fulfilled")) return "is-fulfilled";
  if (action.includes("created")) return "is-created";
  return "is-system";
}

function getStockReadinessSummary(request: NonNullable<RequestDetail>) {
  if (request.status === "fulfilled") {
    return {
      className: "badge badge-stock-issued",
      label: "Issued",
      tone: "issued",
    };
  }
  if (request.status === "rejected") {
    return {
      className: "badge badge-stock-closed",
      label: "Closed",
      tone: "closed",
    };
  }
  if (request.items.length === 0) {
    return {
      className: "badge badge-stock-closed",
      label: "No items",
      tone: "closed",
    };
  }

  const shortCount = request.items.filter(
    (item) => item.availableQuantity < item.requestedQuantity,
  ).length;

  if (shortCount === 0) {
    return {
      className: "badge badge-stock-ready",
      label: "Enough stock",
      tone: "ready",
    };
  }

  if (shortCount === request.items.length) {
    return {
      className: "badge badge-stock-insufficient",
      label: "Insufficient stock",
      tone: "insufficient",
    };
  }

  return {
    className: "badge badge-stock-partial",
    label: `${shortCount} item short`,
    tone: "partial",
  };
}

function getNextActionSummary(
  status: RequestStatus,
  readiness: ReturnType<typeof getStockReadinessSummary>,
) {
  if (status === "pending") {
    return "Review request";
  }
  if (status === "approved") {
    return readiness.tone === "ready" ? "Fulfill request" : "Resolve stock";
  }
  if (status === "fulfilled") {
    return "Complete";
  }
  return "Closed";
}

function formatHistoryMeta(entry: NonNullable<RequestDetail>["requestHistory"][number]) {
  const transition =
    entry.fromStatus || entry.toStatus
      ? ` · ${entry.fromStatus ?? "new"} to ${entry.toStatus ?? "none"}`
      : "";

  return `${entry.actorName} · ${entry.actorRole}${transition}`;
}
