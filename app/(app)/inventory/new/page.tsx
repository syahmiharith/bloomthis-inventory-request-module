import { requireAdmin } from "@/lib/auth";
import { InventoryItemForm } from "@/features/inventory/components/InventoryItemForm";
import { InventoryWorkspace } from "@/features/inventory/components/InventoryWorkspace";

type NewInventoryItemPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    success?: string;
  }>;
};

export default async function NewInventoryItemPage({
  searchParams,
}: NewInventoryItemPageProps) {
  const [currentUser, params] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);

  return (
    <InventoryWorkspace
      currentUser={currentUser}
      searchParams={params ?? {}}
      overlay={<InventoryItemForm />}
    />
  );
}
