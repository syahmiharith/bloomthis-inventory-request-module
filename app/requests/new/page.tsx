import { getCurrentUser } from "@/lib/auth";
import { listItems } from "@/services/item.service";
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
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section data-testid="new-request-page">
        <div className="route-heading">
          <div>
            <h2>New Request</h2>
            <p>Submit an inventory request for admin review.</p>
          </div>
        </div>

        {requestableItems.length === 0 ? (
          <div className="panel">
            <p className="empty-state">No inventory items are available yet.</p>
          </div>
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
