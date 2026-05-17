import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { getRequestById } from "@/services/request.service";
import { RequestDetailFooter, RequestDetailPanel } from "../RequestDetailPanel";
import {
  RequestsWorkspace,
  type RequestWorkspaceSearchParams,
} from "../RequestsWorkspace";

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
  const request = await getRequestOrNotFound(id, currentUser);

  return (
    <RequestsWorkspace
      currentUser={currentUser}
      selectedRequestId={id}
      searchParams={query ?? {}}
      panel={
        <RequestDetailPanel
          isAdmin={currentUser.role === "admin"}
          query={query}
          request={request}
        />
      }
      panelFooter={
        <RequestDetailFooter
          isAdmin={currentUser.role === "admin"}
          request={request}
        />
      }
    />
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
