import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  RequestDetailFooter,
  RequestDetailPanel,
} from "@/features/requests/components/RequestDetailPanel";
import {
  RequestsWorkspace,
  type RequestWorkspaceSearchParams,
} from "@/features/requests/components/RequestsWorkspace";
import { getRequestById } from "@/features/requests/services/request.service";
import { getCurrentUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<RequestWorkspaceSearchParams>;
};

export default async function RequestDetailPage({
  params,
  searchParams,
}: RequestDetailPageProps) {
  const [{ id }, query, currentUser] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const requestPromise = getRequestOrNotFound(id, currentUser);

  return (
    <RequestsWorkspace
      currentUser={currentUser}
      selectedRequestId={id}
      searchParams={query ?? {}}
      panel={
        <Suspense fallback={<RequestPanelSkeleton />}>
          <RequestDetailPanelSlot
            isAdmin={currentUser.role === "admin"}
            query={query}
            requestPromise={requestPromise}
          />
        </Suspense>
      }
      panelFooter={
        <Suspense fallback={<p className="muted">Loading actions...</p>}>
          <RequestDetailFooterSlot
            isAdmin={currentUser.role === "admin"}
            requestPromise={requestPromise}
          />
        </Suspense>
      }
    />
  );
}

async function RequestDetailPanelSlot({
  isAdmin,
  query,
  requestPromise,
}: {
  isAdmin: boolean;
  query: RequestWorkspaceSearchParams | undefined;
  requestPromise: ReturnType<typeof getRequestOrNotFound>;
}) {
  const request = await requestPromise;
  return (
    <RequestDetailPanel isAdmin={isAdmin} query={query} request={request} />
  );
}

async function RequestDetailFooterSlot({
  isAdmin,
  requestPromise,
}: {
  isAdmin: boolean;
  requestPromise: ReturnType<typeof getRequestOrNotFound>;
}) {
  const request = await requestPromise;
  return <RequestDetailFooter isAdmin={isAdmin} request={request} />;
}

function RequestPanelSkeleton() {
  return (
    <div className="panel-detail-stack" aria-hidden="true">
      <section className="panel skeleton-panel-section">
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-line" />
      </section>
      <section className="panel skeleton-panel-section">
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-line short" />
      </section>
    </div>
  );
}

async function getRequestOrNotFound(
  id: string,
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  try {
    return await getRequestById(id, currentUser);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
