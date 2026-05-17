import type { StockStatus } from "@/lib/inventory";

export function StockBadge({ status }: { status: StockStatus }) {
  const tone =
    status === "Out of Stock"
      ? "badge-red"
      : status === "Low Stock"
        ? "badge-amber"
        : "badge-green";

  return <span className={`badge ${tone}`}>{status}</span>;
}
