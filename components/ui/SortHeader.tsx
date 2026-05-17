import Link from "next/link";

type SortDirection = "asc" | "desc";

export function SortHeader({
  activeDir,
  activeSort,
  basePath,
  label,
  params,
  sortKey,
}: {
  activeDir: SortDirection;
  activeSort: string;
  basePath: string;
  label: string;
  params: Record<string, string | undefined>;
  sortKey: string;
}) {
  const isActive = activeSort === sortKey;
  const nextDir: SortDirection = isActive && activeDir === "asc" ? "desc" : "asc";
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "page" || key === "sort" || key === "dir") {
      continue;
    }
    search.set(key, value);
  }

  search.set("sort", sortKey);
  search.set("dir", nextDir);

  return (
    <Link
      aria-label={`Sort by ${label} ${nextDir === "asc" ? "ascending" : "descending"}`}
      className={`sort-link ${isActive ? "is-active" : ""}`}
      href={`${basePath}?${search.toString()}`}
    >
      <span>{label}</span>
      <span className="sort-indicator" aria-hidden="true">
        {isActive ? (activeDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
  );
}

export function sortAria(
  sortKey: string,
  activeSort: string,
  activeDir: SortDirection,
): "ascending" | "descending" | "none" {
  if (sortKey !== activeSort) {
    return "none";
  }
  return activeDir === "asc" ? "ascending" : "descending";
}
