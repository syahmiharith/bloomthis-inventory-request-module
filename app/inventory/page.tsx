import { getCurrentUser } from "@/lib/auth";
import {
  InventoryWorkspace,
  type InventoryWorkspaceSearchParams,
} from "./InventoryWorkspace";

type InventoryPageProps = {
  searchParams?: Promise<InventoryWorkspaceSearchParams>;
};

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const [params, currentUser] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  return (
    <InventoryWorkspace currentUser={currentUser} searchParams={params ?? {}} />
  );
}
