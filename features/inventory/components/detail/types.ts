import type { getItemById } from "@/features/inventory/services/inventory.service";

export type InventoryItemDetail = NonNullable<
  Awaited<ReturnType<typeof getItemById>>
>;
