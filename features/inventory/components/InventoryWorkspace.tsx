import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { CSSProperties } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ClickableRow } from "@/components/ui/ClickableRow";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataToolbar } from "@/components/ui/DataToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/table/Pagination";
import { ColumnResizeHandle } from "@/components/ui/table/ResizableDataTable";
import { SortHeader, sortAria } from "@/components/ui/table/SortHeader";
import { StockBadge } from "@/components/ui/badges/StockBadge";
import type { User } from "@/db/schema";
import { stockStatusFromQuantities } from "@/lib/inventory";
import { listItems } from "@/features/inventory/services/inventory.service";
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
  "stockHealth",
  "status",
  "updated",
] as const;
const sortDirections = ["asc", "desc"] as const;
const inventoryTableColumns = [
  { id: "item", defaultWidth: 320, minWidth: 220 },
  { id: "sku", defaultWidth: 210, minWidth: 170 },
  { id: "available", defaultWidth: 150, minWidth: 120 },
  { id: "health", defaultWidth: 220, minWidth: 170 },
  { id: "demand", defaultWidth: 150, minWidth: 120 },
  { id: "updated", defaultWidth: 130, minWidth: 110 },
  { id: "action", defaultWidth: 48, minWidth: 44 },
];

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
                {query ||
                selectedCategory ||
                selectedStock ||
                searchParams.sort ? (
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
              <DataTable
                className="inventory-table"
                columns={inventoryTableColumns}
                tableId="inventory-table"
              >
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
                      <ColumnResizeHandle
                        columnId="item"
                        minWidth={220}
                        tableId="inventory-table"
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
                      <ColumnResizeHandle
                        columnId="sku"
                        minWidth={170}
                        tableId="inventory-table"
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
                      <ColumnResizeHandle
                        columnId="available"
                        minWidth={120}
                        tableId="inventory-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria(
                        "stockHealth",
                        selectedSort,
                        selectedDir,
                      )}
                      className="col-stock-health"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Stock Health"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="stockHealth"
                      />
                      <ColumnResizeHandle
                        columnId="health"
                        minWidth={170}
                        tableId="inventory-table"
                      />
                    </th>
                    <th className="col-demand">
                      Demand
                      <ColumnResizeHandle
                        columnId="demand"
                        minWidth={120}
                        tableId="inventory-table"
                      />
                    </th>
                    <th
                      aria-sort={sortAria("updated", selectedSort, selectedDir)}
                      className="col-date"
                    >
                      <SortHeader
                        activeDir={selectedDir}
                        activeSort={selectedSort}
                        basePath="/inventory"
                        label="Updated"
                        params={{
                          category: selectedCategory,
                          q: query,
                          stock: selectedStock,
                        }}
                        sortKey="updated"
                      />
                      <ColumnResizeHandle
                        columnId="updated"
                        minWidth={110}
                        tableId="inventory-table"
                      />
                    </th>
                    <th className="col-action">
                      <span className="sr-only">Open details</span>
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
                        <td className="inventory-quantity-cell">
                          <strong>{item.available}</strong>
                          <span className="cell-subtext">
                            {item.unit} · {item.quantityReserved} reserved
                          </span>
                        </td>
                        <td>
                          <StockHealthCell
                            percent={item.stockHealthPercent}
                            status={status}
                          />
                        </td>
                        <td className="demand-cell">
                          {item.activeDemand > 0 ? (
                            <>
                              <strong>{item.activeDemand}</strong>
                              <span className="cell-subtext">
                                active demand
                              </span>
                            </>
                          ) : (
                            <span className="muted">No active demand</span>
                          )}
                        </td>
                        <td className="date-cell">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="row-chevron-cell">
                          <ChevronRight aria-hidden="true" />
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

function StockHealthCell({
  percent,
  status,
}: {
  percent: number | null | undefined;
  status: ReturnType<typeof stockStatusFromQuantities>;
}) {
  const safePercent = normalizeStockHealthPercent(percent);
  return (
    <div className="stock-health-cell">
      <span
        aria-label={
          safePercent === null
            ? "Stock health unavailable"
            : `Stock health ${safePercent} percent`
        }
        className="stock-health-ring"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent ?? undefined}
        style={
          {
            "--stock-health": `${(safePercent ?? 0) * 3.6}deg`,
          } as CSSProperties
        }
      >
        <strong>{safePercent === null ? "-" : `${safePercent}%`}</strong>
      </span>
      <StockBadge status={status} />
    </div>
  );
}

function normalizeStockHealthPercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(Number(value))));
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFilterSummary(filters: Record<string, string>) {
  const active = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`);
  return active.length > 0 ? active.join(", ") : "none";
}
