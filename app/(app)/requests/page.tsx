import { getCurrentUser } from "@/lib/auth";
import {
  RequestsWorkspace,
  type RequestWorkspaceSearchParams,
} from "@/features/requests/components/RequestsWorkspace";

type RequestsPageProps = {
  searchParams?: Promise<RequestWorkspaceSearchParams>;
};

export default async function RequestsPage({
  searchParams,
}: RequestsPageProps) {
  const [params, currentUser] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  return (
    <RequestsWorkspace currentUser={currentUser} searchParams={params ?? {}} />
  );
}
