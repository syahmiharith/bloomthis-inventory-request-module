import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  dashboard: "dashboard",
  inventoryList: "inventory-list",
  requestList: "request-list",
  requestableItems: "requestable-items",
  inventoryDetail: (id: string) => `inventory-detail:${id}`,
  requestDetail: (id: string) => `request-detail:${id}`,
} as const;

export function revalidateInventoryReads(itemId?: string) {
  revalidateTag(CACHE_TAGS.dashboard);
  revalidateTag(CACHE_TAGS.inventoryList);
  revalidateTag(CACHE_TAGS.requestList);
  revalidateTag(CACHE_TAGS.requestableItems);
  if (itemId) {
    revalidateTag(CACHE_TAGS.inventoryDetail(itemId));
  }
}

export function revalidateRequestReads(requestId?: string) {
  revalidateTag(CACHE_TAGS.dashboard);
  revalidateTag(CACHE_TAGS.requestList);
  revalidateTag(CACHE_TAGS.inventoryList);
  revalidateTag(CACHE_TAGS.requestableItems);
  if (requestId) {
    revalidateTag(CACHE_TAGS.requestDetail(requestId));
  }
}
