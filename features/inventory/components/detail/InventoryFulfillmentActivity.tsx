import type { InventoryItemDetail } from "./types";
import { formatDate } from "./utils";

export function InventoryFulfillmentActivity({
  item,
}: {
  item: InventoryItemDetail;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <div>
          <h3>Recent fulfillment activity</h3>
          <p>Completed movement tied to this item.</p>
        </div>
      </div>
      <div className="item-activity-list compact-side-list">
        {item.recentFulfillments.length === 0 ? (
          <p className="muted">No recent fulfillments for this item.</p>
        ) : null}
        {item.recentFulfillments.map((entry) => (
          <article className="compact-detail-card" key={entry.id}>
            <div>
              <strong>{entry.requestCode ?? "Fulfillment"}</strong>
              <span>{entry.actorName}</span>
            </div>
            <time>{formatDate(entry.createdAt)}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
