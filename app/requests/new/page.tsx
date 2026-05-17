import { getCurrentUser } from "@/lib/auth";
import { listItems } from "@/services/item.service";
import { RequestsWorkspace } from "../RequestsWorkspace";
import { EmptyRequestModal } from "./EmptyRequestModal";
import { RequestForm } from "./RequestForm";

type NewRequestPageProps = {
  searchParams?: Promise<{
    category?: string;
    itemId?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function NewRequestPage({
  searchParams,
}: NewRequestPageProps) {
  const [currentUser, items, params] = await Promise.all([
    getCurrentUser(),
    listItems({}),
    searchParams,
  ]);
  const requestableItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    available: item.available,
  }));

  return (
    <RequestsWorkspace
      currentUser={currentUser}
      searchParams={params ?? {}}
      overlay={
        requestableItems.length === 0 ? (
          <EmptyRequestModal />
        ) : (
          <RequestForm
            initialItemId={params?.itemId}
            items={requestableItems}
            requesterName={currentUser.name}
          />
        )
      }
    />
  );
}
