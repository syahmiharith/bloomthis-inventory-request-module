import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  InventoryItemDetailFooter,
  InventoryItemDetailPanel,
} from "@/features/inventory/components/InventoryItemDetailPanel";
import {
  InventoryWorkspace,
  type InventoryWorkspaceSearchParams,
} from "@/features/inventory/components/InventoryWorkspace";
import { getItemById } from "@/features/inventory/services/inventory.service";
import { getCurrentUser } from "@/lib/auth";

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
  const itemPromise = getItemById(id);

  return (
    <InventoryWorkspace
      currentUser={currentUser}
      selectedItemId={id}
      searchParams={query ?? {}}
      panel={
        <Suspense fallback={<InventoryPanelSkeleton />}>
          <InventoryItemDetailPanelSlot
            isAdmin={currentUser.role === "admin"}
            itemPromise={itemPromise}
          />
        </Suspense>
      }
      panelFooter={
        <Suspense fallback={<p className="muted">Loading actions...</p>}>
          <InventoryItemDetailFooterSlot
            isAdmin={currentUser.role === "admin"}
            itemPromise={itemPromise}
          />
        </Suspense>
      }
    />
  );
}

async function InventoryItemDetailPanelSlot({
  isAdmin,
  itemPromise,
}: {
  isAdmin: boolean;
  itemPromise: ReturnType<typeof getItemById>;
}) {
  const item = await itemPromise;

  if (!item) {
    notFound();
  }

  return <InventoryItemDetailPanel isAdmin={isAdmin} item={item} />;
}

async function InventoryItemDetailFooterSlot({
  isAdmin,
  itemPromise,
}: {
  isAdmin: boolean;
  itemPromise: ReturnType<typeof getItemById>;
}) {
  const item = await itemPromise;

  if (!item) {
    notFound();
  }

  return <InventoryItemDetailFooter isAdmin={isAdmin} item={item} />;
}

function InventoryPanelSkeleton() {
  return (
    <div className="panel-detail-stack" aria-hidden="true">
      <section className="panel skeleton-panel-section">
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-line" />
        <span className="skeleton skeleton-line short" />
      </section>
      <section className="panel skeleton-panel-section">
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-line" />
      </section>
    </div>
  );
}
