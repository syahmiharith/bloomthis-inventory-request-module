import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortHeader, sortAria } from "@/components/ui/SortHeader";
import { StockBadge } from "@/components/ui/StockBadge";
import type { User } from "@/db/schema";
import { stockStatusFromQuantities } from "@/lib/inventory";
import { listItems } from "@/services/item.service";
import { InventoryCreateModalButton } from "./InventoryCreateModalButton";

export type InventoryWorkspaceSearchParams = {
  category?: string;
  page?: string;
  q?: string;
  dir?: string;
  sort?: string;
  stock?: string;
  success?: string;
};

const pageSize = 25;
const stockFilters = ["in", "low", "out"] as const;
const inventorySortKeys = [
  "name",
  "sku",
  "category",
  "available",
  "threshold",
  "status",
] as const;
const sortDirections = ["asc", "desc"] as const;

export async function InventoryWorkspace({
  currentUser,
  overlay,
  panel,
  panelFooter,
  selectedItemId,
  searchParams,
}: {
  currentUser: User;
  overlay?: React.ReactNode;
  panel?: React.ReactNode;
  panelFooter?: React.ReactNode;
  selectedItemId?: string;
  searchParams: InventoryWorkspaceSearchParams;
}) {
  const query = searchParams.q?.trim() ?? "";
  const selectedCategory = searchParams.category?.trim() ?? "";
  const selectedStock: "" | (typeof stockFilters)[number] =
    stockFilters.includes(searchParams.stock as (typeof stockFilters)[number])
      ? (searchParams.stock as (typeof stockFilters)[number])
      : "";
  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const selectedSort = inventorySortKeys.includes(
    searchParams.sort as (typeof inventorySortKeys)[number],
  )
    ? (searchParams.sort as (typeof inventorySortKeys)[number])
    : "name";
  const selectedDir = sortDirections.includes(
    searchParams.dir as (typeof sortDirections)[number],
  )
    ? (searchParams.dir as (typeof sortDirections)[number])
    : "asc";
  const itemResult = await listItems({
    category: selectedCategory,
    dir: selectedDir,
    page: currentPage,
    pageSize,
    q: query,
    sort: selectedSort,
    stock: selectedStock,
  });
  const categories = itemResult.categories;
  const pagedItems = itemResult.rows;
  const selectedOutsideFilters =
    selectedItemId !== undefined &&
    !pagedItems.some((item) => item.id === selectedItemId);
  const isAdmin = currentUser.role === "admin";

  return (
    <WorkspaceLayout
      sidePanel={
        panel
          ? {
              children: panel,
              closeHref: "/inventory",
              footer: panelFooter,
              title: "Item Details",
            }
          : undefined
      }
    >
      <main
        className="page-scroll main-scroll-region route-page"
        data-testid="main-scroll-region"
      >
        <section data-testid="inventory-page">
          <PageHeader
            title="Inventory"
            description="Browse current stock levels and identify low-stock or out-of-stock items."
            actions={isAdmin ? <InventoryCreateModalButton /> : null}
          />

          {searchParams.success ? (
            <p aria-live="polite" className="alert alert-success">
              {searchParams.success}
            </p>
          ) : null}
          {selectedOutsideFilters ? (
            <p aria-live="polite" className="alert alert-info">
              The selected item is outside the current page or filters. Clear
              filters or change pages to show it in the table.
            </p>
          ) : null}

          <section className="panel inventory-control-panel">
            <form action="/inventory">
              <DataToolbar>
                <label className="search-field">
                  <span className="sr-only">Search inventory</span>
                  <Search />
                  <input
                    className="input"
                    defaultValue={query}
                    name="q"
                    placeholder="Search by item name or SKU"
                    type="search"
                  />
                </label>
                <label className="filter-select">
                  <span>Category</span>
                  <select defaultValue={selectedCategory} name="category">
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-select">
                  <span>Stock</span>
                  <select defaultValue={selectedStock} name="stock">
                    <option value="">All stock</option>
                    <option value="in">In stock</option>
                    <option value="low">Low stock</option>
                    <option value="out">Out of stock</option>
                  </select>
                </label>
                <button className="button button-secondary" type="submit">
                  Filter
                </button>
                {query || selectedCategory || selectedStock || searchParams.sort ? (
                  <Link className="clear-filter-link" href="/inventory">
                    Clear filters
                  </Link>
                ) : null}
              </DataToolbar>
            </form>
            <p className="list-count-meta">
              Showing {pagedItems.length} of {itemResult.totalCount} inventory
              rows · filters{" "}
              {formatFilterSummary({
                category: selectedCategory,
                q: query,
                stock: selectedStock,
              })}
            </p>

            {itemResult.totalCount === 0 ? (
              <EmptyState
                action={isAdmin ? <InventoryCreateModalButton /> : null}
              >
                No inventory items match this view.
              </EmptyState>
            ) : (
              <DataTable className="inventory-table">
                <thead>
                  <tr>
                    <th
                      aria-sort={sortAria("name", selectedSort, selectedDir)}
                      className="col-item"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Item"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="name"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("sku", selectedSort, selectedDir)}
                      className="col-code col-sku"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="SKU"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="sku"
                      />
                    </th>
                    <th
                      aria-sort={sortAria(
                        "category",
                        selectedSort,
                        selectedDir,
                      )}
                      className="col-category hide-sm"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Category"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="category"
                      />
                    </th>
                    <th
                      aria-sort={sortAria(
                        "available",
                        selectedSort,
                        selectedDir,
                      )}
                      className="col-number"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Available"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="available"
                      />
                    </th>
                    {isAdmin ? (
                      <th
                        aria-sort={sortAria(
                          "threshold",
                          selectedSort,
                          selectedDir,
                        )}
                        className="col-number hide-md"
                      >
                        <SortHeader
                          activeDir={selectedDir}
                          activeSort={selectedSort}
                          basePath="/inventory"
                          label="Threshold"
                          params={{
                            category: selectedCategory,
                            q: query,
                            stock: selectedStock,
                          }}
                          sortKey="threshold"
                        />
                      </th>
                    ) : null}
                    <th
                      aria-sort={sortAria("status", selectedSort, selectedDir)}
                      className="col-status"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Status"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="status"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
                    const status = stockStatusFromQuantities(
                      item.quantityOnHand,
                      item.quantityReserved,
                      item.reorderPoint,
                    );
                    return (
                      <ClickableRow
                        className={
                          status === "Out of Stock"
                            ? "is-out"
                            : status === "Low Stock"
                              ? "is-low"
                              : undefined
                        }
                        href={`/inventory/${item.id}`}
                        key={item.id}
                        selected={selectedItemId === item.id}
                      >
                        <td className="item-primary-cell" title={item.name}>
                          <strong>{item.name}</strong>
                          <span className="cell-subtext">
                            {item.category} · {item.warehouse}
                          </span>
                        </td>
                        <td className="mono-cell sku-cell" title={item.sku}>
                          {item.sku}
                        </td>
                        <td
                          className="truncate-cell hide-sm"
                          title={item.category}
                        >
                          {item.category}
                        </td>
                        <td className="inventory-quantity-cell">
                          <strong>{item.available}</strong>
                          <span className="cell-subtext">
                            {item.unit} · min {item.reorderPoint}
                          </span>
                        </td>
                        {isAdmin ? (
                          <td className="numeric-cell hide-md">
                            {item.reorderPoint}
                          </td>
                        ) : null}
                        <td>
                          <StockBadge status={status} />
                        </td>
                      </ClickableRow>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
            {itemResult.totalCount > pageSize ? (
              <Pagination
                basePath="/inventory"
                page={itemResult.page}
                pageCount={itemResult.pageCount}
                searchParams={{
                  category: selectedCategory,
                  dir: selectedDir,
                  q: query,
                  sort: selectedSort,
                  stock: selectedStock,
                }}
              />
            ) : null}
          </section>
        </section>
        {overlay}
      </main>
    </WorkspaceLayout>
  );
}

function formatFilterSummary(filters: Record<string, string>) {
  const active = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`);
  return active.length > 0 ? active.join(", ") : "none";
}

function Pagination({
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
  return (
    <div className="pagination-row">
      <span>
        Page {page} of {pageCount}
      </span>
      <div>
        <Link
          aria-disabled={page <= 1}
          className="button button-secondary button-compact"
          href={pageHref(basePath, searchParams, page - 1)}
        >
          Previous
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className="button button-secondary button-compact"
          href={pageHref(basePath, searchParams, page + 1)}
        >
          Next
        </Link>
      </div>
    </div>
  );
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
