import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getItemById } from "@/services/item.service";
import { InventoryItemDetailPanel } from "../InventoryItemDetailPanel";
import {
  InventoryWorkspace,
  type InventoryWorkspaceSearchParams,
} from "../InventoryWorkspace";

type InventoryDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<InventoryWorkspaceSearchParams>;
};

export default async function InventoryDetailPage({
  params,
  searchParams,
}: InventoryDetailPageProps) {
  const [{ id }, query, currentUser] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <InventoryWorkspace
      currentUser={currentUser}
      selectedItemId={id}
      searchParams={query ?? {}}
      panel={
        <InventoryItemDetailPanel
          isAdmin={currentUser.role === "admin"}
          item={item}
        />
      }
    />
  );
}
