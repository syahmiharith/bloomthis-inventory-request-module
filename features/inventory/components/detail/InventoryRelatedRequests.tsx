import { StatusBadge } from "@/components/ui/badges/StatusBadge";
import type { InventoryItemDetail } from "./types";

export function InventoryRelatedRequests({
  item,
}: {
  item: InventoryItemDetail;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <div>
          <h3>Recent request activity</h3>
          <p>Latest requests that include this item.</p>
        </div>
      </div>
      <div className="related-request-list compact-side-list">
        {item.recentRequests.length === 0 ? (
          <p className="muted">No recent requests for this item.</p>
        ) : null}
        {item.recentRequests.map((request) => (
          <article className="compact-detail-card" key={request.id}>
            <div>
              <a className="mono-cell" href={`/requests/${request.id}`}>
                {request.requestCode}
              </a>
              <span>{request.requesterName}</span>
            </div>
            <div>
              <StatusBadge status={request.status} />
              <strong>
                {request.quantityRequested} {request.unit}
              </strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
