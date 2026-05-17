import type { RequestStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: RequestStatus }) {
  const tone =
    status === "fulfilled"
      ? "badge-green"
      : status === "approved"
        ? "badge-blue"
        : status === "rejected"
          ? "badge-red"
          : "badge-amber";

  return <span className={`badge ${tone}`}>{capitalize(status)}</span>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
