import { getCurrentUser } from "@/lib/auth";
import { listItems } from "@/services/item.service";
import { EmptyRequestModal } from "./EmptyRequestModal";
import { RequestForm } from "./RequestForm";

type NewRequestPageProps = {
  searchParams?: Promise<{
    itemId?: string;
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
    <main
      className="page-scroll main-scroll-region route-page modal-route"
      data-testid="main-scroll-region"
    >
      <section data-testid="new-request-page">
        {requestableItems.length === 0 ? (
          <EmptyRequestModal />
        ) : (
          <RequestForm
            initialItemId={params?.itemId}
            items={requestableItems}
            requesterName={currentUser.name}
          />
        )}
      </section>
    </main>
  );
}
