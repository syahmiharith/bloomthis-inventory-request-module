export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function normalizeStockHealthPercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(Number(value))));
}
