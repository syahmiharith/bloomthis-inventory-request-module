import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import type { RequestStatus } from "@/lib/constants";
import { listRequests } from "@/services/request.service";
import { updateRequestStatusAction } from "./actions";

type RequestsPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const params = (await searchParams) ?? {};
  const currentUser = await getCurrentUser();
  const requests = await listRequests({}, currentUser);
  const isAdmin = currentUser.role === "admin";

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
            <Link className="button button-primary actions" href="/requests/new">
              <PlusCircle size={16} />
              Create Request
            </Link>
          ) : null}
        </div>

        {params.error ? (
          <p className="alert alert-error">{params.error}</p>
        ) : null}

        <section className="panel">
          {requests.length === 0 ? (
            <p className="empty-state">No requests found.</p>
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
                  {requests.map((request) => {
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
                      <tr key={request.id}>
                        <td className="mono-cell">{request.requestCode}</td>
                        {isAdmin ? <td>{request.requesterName}</td> : null}
                        <td>
                          {request.items.map((item) => item.itemName).join(", ")}
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
  requestId,
  status,
}: {
  canFulfill: boolean;
  requestId: string;
  status: RequestStatus;
}) {
  if (status === "pending") {
    return (
      <>
        <StatusForm requestId={requestId} status="approved" label="Approve" />
        <StatusForm
          adminComment="Rejected from request list."
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
      <StatusForm
        disabled={!canFulfill}
        requestId={requestId}
        status="fulfilled"
        label="Fulfill"
      />
    );
  }

  return null;
}

function StatusForm({
  adminComment,
  disabled = false,
  label,
  requestId,
  status,
  variant = "secondary",
}: {
  adminComment?: string;
  disabled?: boolean;
  label: string;
  requestId: string;
  status: RequestStatus;
  variant?: "secondary" | "danger";
}) {
  return (
    <form action={updateRequestStatusAction}>
      <input name="requestId" type="hidden" value={requestId} />
      <input name="status" type="hidden" value={status} />
      {adminComment ? (
        <input name="adminComment" type="hidden" value={adminComment} />
      ) : null}
      <button
        className={`button button-${variant}`}
        disabled={disabled}
        type="submit"
      >
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
