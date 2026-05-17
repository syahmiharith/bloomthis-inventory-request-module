import type { RequestStatus } from "@/lib/constants";
import type { RequestDetail } from "./types";

export function getStockReadinessSummary(request: NonNullable<RequestDetail>) {
  if (request.status === "fulfilled") {
    return {
      className: "badge badge-stock-issued",
      label: "Issued",
      tone: "issued",
    };
  }
  if (request.status === "rejected") {
    return {
      className: "badge badge-stock-closed",
      label: "Closed",
      tone: "closed",
    };
  }
  if (request.items.length === 0) {
    return {
      className: "badge badge-stock-closed",
      label: "No items",
      tone: "closed",
    };
  }

  const shortCount = request.items.filter(
    (item) => item.availableQuantity < item.requestedQuantity,
  ).length;

  if (shortCount === 0) {
    return {
      className: "badge badge-stock-ready",
      label: "Enough stock",
      tone: "ready",
    };
  }

  if (shortCount === request.items.length) {
    return {
      className: "badge badge-stock-insufficient",
      label: "Insufficient stock",
      tone: "insufficient",
    };
  }

  return {
    className: "badge badge-stock-partial",
    label: `${shortCount} item short`,
    tone: "partial",
  };
}

export function getNextActionSummary(
  status: RequestStatus,
  readiness: ReturnType<typeof getStockReadinessSummary>,
) {
  if (status === "pending") {
    return "Review request";
  }
  if (status === "approved") {
    return readiness.tone === "ready" ? "Fulfill request" : "Resolve stock";
  }
  if (status === "fulfilled") {
    return "Complete";
  }
  return "Closed";
}
