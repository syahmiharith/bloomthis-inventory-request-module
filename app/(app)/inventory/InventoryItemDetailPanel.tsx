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
    <div
      className="inventory-detail-sheet"
      data-testid="inventory-detail-panel"
    >
      <section className="inventory-detail-hero" aria-labelledby="item-title">
        <div className="inventory-detail-hero-top">
          <div className="inventory-detail-title">
            <span className="eyebrow">Inventory item</span>
            <h3 id="item-title">{item.name}</h3>
            <p className="sku-cell">{item.sku}</p>
          </div>
          <StockBadge status={status} />
        </div>

        <div className="inventory-health-summary">
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
          <div>
            <span>Available stock</span>
            <strong>
              {item.available} {item.unit}
            </strong>
            <p>
              Health compares available stock with the internal operating
              target.
            </p>
          </div>
        </div>

        <dl className="inventory-detail-meta">
          <div>
            <dt>Category</dt>
            <dd>{item.category}</dd>
          </div>
          <div>
            <dt>Warehouse</dt>
            <dd>{item.warehouse}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <div>
            <h3>Stock analytics</h3>
            <p>Operational demand and inventory position.</p>
          </div>
        </div>
        <div className="detail-metric-grid">
          <MetricCard label="On hand" value={item.quantityOnHand} />
          <MetricCard label="Reserved" value={item.quantityReserved} />
          <MetricCard label="Active demand" value={item.activeDemand} />
          <MetricCard label="Pending requests" value={item.pendingRequestCount} />
          <MetricCard
            label="Approved requests"
            value={item.approvedRequestCount}
          />
          <MetricCard label="Risk label" value={status} />
        </div>
      </section>

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
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="detail-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
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
