import Link from "next/link";
import type { ReactNode } from "react";

export function Pagination({
  basePath,
  page,
  pageCount,
  searchParams,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  searchParams: Record<string, string>;
}) {
  const pages = visiblePages(page, pageCount);

  return (
    <nav aria-label="Pagination" className="pagination-row">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="pagination-controls">
        <PaginationItem
          ariaLabel="Previous page"
          disabled={page <= 1}
          href={pageHref(basePath, searchParams, page - 1)}
        >
          &lt;
        </PaginationItem>
        {pages.map((pageNumber) => (
          <PaginationItem
            ariaCurrent={pageNumber === page ? "page" : undefined}
            ariaLabel={`Page ${pageNumber}`}
            href={pageHref(basePath, searchParams, pageNumber)}
            key={pageNumber}
          >
            {pageNumber}
          </PaginationItem>
        ))}
        <PaginationItem
          ariaLabel="Next page"
          disabled={page >= pageCount}
          href={pageHref(basePath, searchParams, page + 1)}
        >
          &gt;
        </PaginationItem>
      </div>
    </nav>
  );
}

function PaginationItem({
  ariaCurrent,
  ariaLabel,
  children,
  disabled = false,
  href,
}: {
  ariaCurrent?: "page";
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={ariaLabel}
        className="pagination-button is-disabled"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      className="pagination-button"
      href={href}
    >
      {children}
    </Link>
  );
}

function visiblePages(page: number, pageCount: number) {
  const windowSize = Math.min(3, pageCount);
  const start = Math.min(Math.max(1, page - 1), pageCount - windowSize + 1);
  return Array.from({ length: windowSize }, (_, index) => start + index);
}

function pageHref(
  basePath: string,
  searchParams: Record<string, string>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(Math.max(1, page)));
  return `${basePath}?${params.toString()}`;
}
