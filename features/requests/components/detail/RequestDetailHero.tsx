import { StatusBadge } from "@/components/ui/badges/StatusBadge";
import { getNextActionSummary, getStockReadinessSummary } from "./RequestStockSummary";
import type { RequestDetail } from "./types";
import { formatDateTime } from "./utils";

export function RequestDetailHero({
  request,
  totalQuantity,
}: {
  request: NonNullable<RequestDetail>;
  totalQuantity: number;
}) {
  const stockReadiness = getStockReadinessSummary(request);
  const nextAction = getNextActionSummary(request.status, stockReadiness);

  return (
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
  );
}
