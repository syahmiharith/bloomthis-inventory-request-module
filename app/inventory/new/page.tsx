import { requireAdmin } from "@/lib/auth";
import { InventoryItemForm } from "./InventoryItemForm";

export default async function NewInventoryItemPage() {
  await requireAdmin();

  return (
    <main
      className="page-scroll main-scroll-region route-page modal-route"
      data-testid="main-scroll-region"
    >
      <section data-testid="new-inventory-item-page">
        <InventoryItemForm />
      </section>
    </main>
  );
}
