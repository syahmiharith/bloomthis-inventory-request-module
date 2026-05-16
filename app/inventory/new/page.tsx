import { requireAdmin } from "@/lib/auth";
import { InventoryItemForm } from "./InventoryItemForm";

export default async function NewInventoryItemPage() {
  await requireAdmin();

  return (
    <main
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section data-testid="new-inventory-item-page">
        <div className="route-heading">
          <div>
            <h2>Add Inventory Item</h2>
            <p>Create a stock item with a SKU, category, and threshold.</p>
          </div>
        </div>

        <InventoryItemForm />
      </section>
    </main>
  );
}
