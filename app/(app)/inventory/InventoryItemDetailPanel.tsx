import { StatusBadge } from "@/components/ui/StatusBadge";
import { StockBadge } from "@/components/ui/StockBadge";
import { stockStatusFromQuantities } from "@/lib/inventory";
import type { getItemById } from "@/services/item.service";
import type { CSSProperties } from "react";

type InventoryItemDetail = NonNullable<Awaited<ReturnType<typeof getItemById>>>;

export function InventoryItemDetailPanel({
  isAdmin,
  item,
}: {
  isAdmin: boolean;
  item: InventoryItemDetail;
}) {
  const status = stockStatusFromQuantities(
    item.quantityOnHand,
    item.quantityReserved,
    item.reorderPoint,
  );
  const stockHealthPercent = normalizeStockHealthPercent(
    item.stockHealthPercent,
  );
  const stockHealthLabel =
    stockHealthPercent === null ? "-" : `${stockHealthPercent}%`;

  return (
    <div className="panel-detail-stack" data-testid="inventory-detail-panel">
      <section className="panel">
        <div className="panel-header stacked-panel-header">
          <div>
            <h3>{item.name}</h3>
            <p>{item.sku}</p>
          </div>
          <StockBadge status={status} />
        </div>
        <dl className="details-grid panel-details-grid">
          <div>
            <dt>SKU</dt>
            <dd>{item.sku}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{item.category}</dd>
          </div>
          <div>
            <dt>Warehouse</dt>
            <dd>{item.warehouse}</dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{item.unit}</dd>
          </div>
          <div>
            <dt>Available stock</dt>
            <dd>{item.available}</dd>
          </div>
          <div>
            <dt>Stock health</dt>
            <dd>{stockHealthLabel}</dd>
          </div>
          <div>
            <dt>On hand</dt>
            <dd>{item.quantityOnHand}</dd>
          </div>
          <div>
            <dt>Reserved</dt>
            <dd>{item.quantityReserved}</dd>
          </div>
          <div>
            <dt>Active demand</dt>
            <dd>{item.activeDemand}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel item-details-panel">
        <h3>Stock Analytics</h3>
        <div className="stock-health-grid">
          <div>
            <span>Pending requests</span>
            <strong>{item.pendingRequestCount}</strong>
          </div>
          <div>
            <span>Approved requests</span>
            <strong>{item.approvedRequestCount}</strong>
          </div>
          <div>
            <span>Risk label</span>
            <strong>{status}</strong>
          </div>
        </div>
        <div className="stock-health-detail">
          <span
            aria-label={
              stockHealthPercent === null
                ? "Stock health unavailable"
                : `Stock health ${stockHealthPercent} percent`
            }
            className="stock-health-ring stock-health-ring-large"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stockHealthPercent ?? undefined}
            style={
              {
                "--stock-health": `${(stockHealthPercent ?? 0) * 3.6}deg`,
              } as CSSProperties
            }
          >
            <strong>{stockHealthLabel}</strong>
          </span>
          <p>
            Health compares available stock with the internal operating target
            for this item.
          </p>
        </div>
      </section>

      <section className="panel item-details-panel">
        <h3>Recent Request Activity</h3>
        <div className="related-request-list">
          {item.recentRequests.length === 0 ? (
            <p className="muted">No recent requests for this item.</p>
          ) : null}
          {item.recentRequests.map((request) => (
            <article key={request.id}>
              <a className="mono-cell" href={`/requests/${request.id}`}>
                {request.requestCode}
              </a>
              <StatusBadge status={request.status} />
              <span>{request.requesterName}</span>
              <span>
                {request.quantityRequested} {request.unit}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel item-details-panel">
        <h3>Recent Fulfillment Activity</h3>
        <div className="item-activity-list">
          {item.recentFulfillments.length === 0 ? (
            <p className="muted">No recent fulfillments for this item.</p>
          ) : null}
          {item.recentFulfillments.map((entry) => (
            <article key={entry.id}>
              <strong>{entry.requestCode ?? "Fulfillment"}</strong>
              <span>{entry.actorName}</span>
              <time>{formatDate(entry.createdAt)}</time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function InventoryItemDetailFooter({
  isAdmin,
  item,
}: {
  isAdmin: boolean;
  item: InventoryItemDetail;
}) {
  if (isAdmin) {
    return (
      <div className="item-panel-actions">
        <a
          className="button button-compact button-panel-secondary"
          href={`/requests?status=pending&q=${encodeURIComponent(item.sku)}`}
        >
          View pending requests
        </a>
        <a
          className="button button-compact button-panel-primary"
          href={`/requests?status=approved&q=${encodeURIComponent(item.sku)}`}
        >
          Review approved requests
        </a>
      </div>
    );
  }

  if (item.available <= 0) {
    return (
      <p className="alert alert-error">
        This item is currently out of stock and cannot be requested.
      </p>
    );
  }

  return (
    <a
      className="button button-compact button-panel-primary"
      href={`/requests/new?itemId=${item.id}`}
    >
      Request Item
    </a>
  );
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizeStockHealthPercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(Number(value))));
}
