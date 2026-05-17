import { StockBadge } from "@/components/ui/StockBadge";
import { stockStatusFromQuantities } from "@/lib/inventory";
import type { getItemById } from "@/services/item.service";

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
            <dt>Low-stock threshold</dt>
            <dd>{item.reorderPoint}</dd>
          </div>
          <div>
            <dt>On hand</dt>
            <dd>{item.quantityOnHand}</dd>
          </div>
          <div>
            <dt>Reserved</dt>
            <dd>{item.quantityReserved}</dd>
          </div>
        </dl>
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
    return <p className="muted">No item editing actions are enabled.</p>;
  }

  if (item.available <= 0) {
    return (
      <p className="alert alert-error">
        This item is currently out of stock and cannot be requested.
      </p>
    );
  }

  return (
    <a className="button button-primary" href={`/requests/new?itemId=${item.id}`}>
      Request Item
    </a>
  );
}
