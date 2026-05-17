import { getCurrentUser } from "@/lib/auth";
import { listRequestableItems } from "@/services/item.service";
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
    listRequestableItems(),
    searchParams,
  ]);

  return (
    <RequestsWorkspace
      currentUser={currentUser}
      searchParams={params ?? {}}
      overlay={
        items.length === 0 ? (
          <EmptyRequestModal />
        ) : (
          <RequestForm
            initialItemId={params?.itemId}
            items={items}
            requesterName={currentUser.name}
          />
        )
      }
    />
  );
}
