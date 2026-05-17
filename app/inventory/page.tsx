import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { stockStatusFromQuantities, type StockStatus } from "@/lib/inventory";
import { listItems } from "@/services/item.service";

type InventoryPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    success?: string;
  }>;
};

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category?.trim() ?? "";
  const currentUser = await getCurrentUser();
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
    <main
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section data-testid="inventory-page">
        <div className="route-heading">
          <div>
            <h2>Inventory</h2>
            <p>
              Browse current stock levels and identify low-stock or out-of-stock
              items.
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

        {params.success ? (
          <p aria-live="polite" className="alert alert-success">
            {params.success}
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
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    {isAdmin ? <th>SKU</th> : null}
                    <th>Category</th>
                    <th>Available</th>
                    {isAdmin ? <th>Low-stock threshold</th> : null}
                    <th>Status</th>
                    <th>Action</th>
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
                      <tr
                        className={
                          status === "Out of Stock"
                            ? "is-out"
                            : status === "Low Stock"
                              ? "is-low"
                              : undefined
                        }
                        key={item.id}
                      >
                        <td>
                          <strong>{item.name}</strong>
                          {!isAdmin ? (
                            <span className="muted"> {item.sku}</span>
                          ) : null}
                        </td>
                        {isAdmin ? (
                          <td className="mono-cell">{item.sku}</td>
                        ) : null}
                        <td>{item.category}</td>
                        <td className="numeric-cell">{item.available}</td>
                        {isAdmin ? (
                          <td className="numeric-cell">{item.reorderPoint}</td>
                        ) : null}
                        <td>
                          <StockBadge status={status} />
                        </td>
                        <td>
                          {isAdmin ? (
                            <span className="muted">View</span>
                          ) : item.available > 0 ? (
                            <Link
                              className="inline-link"
                              href={`/requests/new?itemId=${item.id}`}
                            >
                              Request
                            </Link>
                          ) : (
                            <span className="muted">Unavailable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
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
