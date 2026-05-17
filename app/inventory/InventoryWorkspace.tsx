import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { SplitWorkspace } from "@/components/layout/SplitWorkspace";
import { ClickableRow } from "@/components/ui/ClickableRow";
import type { User } from "@/db/schema";
import { stockStatusFromQuantities, type StockStatus } from "@/lib/inventory";
import { listItems } from "@/services/item.service";

export type InventoryWorkspaceSearchParams = {
  category?: string;
  q?: string;
  success?: string;
};

export async function InventoryWorkspace({
  currentUser,
  panel,
  searchParams,
}: {
  currentUser: User;
  panel?: React.ReactNode;
  searchParams: InventoryWorkspaceSearchParams;
}) {
  const query = searchParams.q?.trim() ?? "";
  const selectedCategory = searchParams.category?.trim() ?? "";
  const allItems = await listItems({});
  const categories = Array.from(
    new Set(allItems.map((item) => item.category)),
  ).sort((left, right) => left.localeCompare(right));
  const filteredItems = allItems.filter((item) => {
    const matchesQuery =
      query.length === 0 ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.sku.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory.length === 0 || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });
  const isAdmin = currentUser.role === "admin";

  return (
    <SplitWorkspace
      panel={
        panel
          ? {
              children: panel,
              closeHref: "/inventory",
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
          <div className="route-heading">
            <div>
              <h2>Inventory</h2>
              <p>
                Browse current stock levels and identify low-stock or
                out-of-stock items.
              </p>
            </div>
            {isAdmin ? (
              <Link
                className="button button-primary actions"
                href="/inventory/new"
              >
                <PlusCircle size={16} />
                Add Item
              </Link>
            ) : null}
          </div>

          {searchParams.success ? (
            <p aria-live="polite" className="alert alert-success">
              {searchParams.success}
            </p>
          ) : null}

          <section className="panel inventory-control-panel">
            <form className="stock-toolbar" action="/inventory">
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
              <button className="button button-secondary" type="submit">
                Filter
              </button>
              {query || selectedCategory ? (
                <Link className="clear-filter-link" href="/inventory">
                  Clear filters
                </Link>
              ) : null}
            </form>

            {filteredItems.length === 0 ? (
              <div className="empty-state-card">
                <p>No inventory items match this view.</p>
                {isAdmin ? (
                  <Link className="button button-primary" href="/inventory/new">
                    Add Inventory Item
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="table-wrap stock-table-wrap">
                <table className="data-table inventory-table">
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
                    {filteredItems.map((item) => {
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
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    </SplitWorkspace>
  );
}

function StockBadge({ status }: { status: StockStatus }) {
  const tone =
    status === "Out of Stock"
      ? "badge-red"
      : status === "Low Stock"
        ? "badge-amber"
        : "badge-green";
  return <span className={`badge ${tone}`}>{status}</span>;
}
