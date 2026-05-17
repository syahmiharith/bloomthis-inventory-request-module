import type { RequestStatus } from "@/lib/constants";
import { updateRequestDetailStatusAction } from "@/features/requests/actions/updateRequestDetailStatus";
import { StatusActionForm } from "../StatusActionForm";
import type { RequestDetail } from "./types";

export function RequestDetailFooter({
  isAdmin,
  request,
}: {
  isAdmin: boolean;
  request: NonNullable<RequestDetail>;
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
