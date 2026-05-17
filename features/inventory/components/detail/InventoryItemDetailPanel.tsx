import { InventoryDetailHero } from "./InventoryDetailHero";
import { InventoryFulfillmentActivity } from "./InventoryFulfillmentActivity";
import { InventoryMetricGrid } from "./InventoryMetricGrid";
import { InventoryRelatedRequests } from "./InventoryRelatedRequests";
import type { InventoryItemDetail } from "./types";

export function InventoryItemDetailPanel({
  item,
}: {
  isAdmin: boolean;
  item: InventoryItemDetail;
}) {
  return (
    <div
      className="inventory-detail-sheet"
      data-testid="inventory-detail-panel"
    >
      <InventoryDetailHero item={item} />
      <InventoryMetricGrid item={item} />
      <InventoryRelatedRequests item={item} />
      <InventoryFulfillmentActivity item={item} />
    </div>
  );
}
