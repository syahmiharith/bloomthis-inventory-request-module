import type { RequestStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: RequestStatus }) {
  const tone =
    status === "fulfilled"
      ? "badge-status-fulfilled"
      : status === "approved"
        ? "badge-status-approved"
        : status === "rejected"
          ? "badge-status-rejected"
          : "badge-status-pending";

  return <span className={`badge ${tone}`}>{capitalize(status)}</span>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
