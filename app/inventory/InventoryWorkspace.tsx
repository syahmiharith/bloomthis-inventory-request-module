import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StockBadge } from "@/components/ui/StockBadge";
import type { User } from "@/db/schema";
import { stockStatusFromQuantities } from "@/lib/inventory";
import { listItems } from "@/services/item.service";
import { InventoryCreateModalButton } from "./InventoryCreateModalButton";

export type InventoryWorkspaceSearchParams = {
  category?: string;
  page?: string;
  q?: string;
  stock?: string;
  success?: string;
};

const pageSize = 25;
const stockFilters = ["in", "low", "out"] as const;

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
  const selectedStock: "" | (typeof stockFilters)[number] = stockFilters.includes(
    searchParams.stock as (typeof stockFilters)[number],
  )
    ? (searchParams.stock as (typeof stockFilters)[number])
    : "";
  const currentPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const allItems = await listItems({});
  const categories = Array.from(
    new Set(allItems.map((item) => item.category)),
  ).sort((left, right) => left.localeCompare(right));
  const filteredItems = allItems.filter((item) => {
    const status = stockStatusFromQuantities(
      item.quantityOnHand,
      item.quantityReserved,
      item.reorderPoint,
    );
    const matchesQuery =
      query.length === 0 ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.sku.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory.length === 0 || item.category === selectedCategory;
    const matchesStock =
      selectedStock === "" ||
      (selectedStock === "in" && status === "In Stock") ||
      (selectedStock === "low" && status === "Low Stock") ||
      (selectedStock === "out" && status === "Out of Stock");
    return matchesQuery && matchesCategory && matchesStock;
  });
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pagedItems = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const selectedOutsideFilters =
    selectedItemId !== undefined &&
    !filteredItems.some((item) => item.id === selectedItemId);
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
              The selected item is outside the current filters. Clear filters to
              show it in the table.
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
              {query || selectedCategory || selectedStock ? (
                <Link className="clear-filter-link" href="/inventory">
                  Clear filters
                </Link>
              ) : null}
              </DataToolbar>
            </form>

            {filteredItems.length === 0 ? (
              <EmptyState
                action={
                  isAdmin ? (
                    <InventoryCreateModalButton />
                  ) : null
                }
              >
                No inventory items match this view.
              </EmptyState>
            ) : (
              <DataTable className="inventory-table">
                  <thead>
                    <tr>
                      <th className="col-item">Item</th>
                      {isAdmin ? <th className="col-code hide-md">SKU</th> : null}
                      <th className="col-category">Category</th>
                      <th className="col-number">Available</th>
                      {isAdmin ? <th className="col-number hide-md">Low-stock threshold</th> : null}
                      <th className="col-status">Status</th>
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
                          <td className="truncate-cell" title={item.name}>
                            <strong>{item.name}</strong>
                            {!isAdmin ? (
                              <span className="muted"> {item.sku}</span>
                            ) : null}
                          </td>
                          {isAdmin ? (
                            <td className="mono-cell truncate-cell hide-md" title={item.sku}>
                              {item.sku}
                            </td>
                          ) : null}
                          <td className="truncate-cell" title={item.category}>
                            {item.category}
                          </td>
                          <td className="numeric-cell">{item.available}</td>
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
            {filteredItems.length > pageSize ? (
              <Pagination
                basePath="/inventory"
                page={safePage}
                pageCount={pageCount}
                searchParams={{
                  category: selectedCategory,
                  q: query,
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
