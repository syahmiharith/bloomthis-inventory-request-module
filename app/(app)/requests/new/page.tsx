import { getCurrentUser } from "@/lib/auth";
import { RequestsWorkspace } from "../RequestsWorkspace";
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
  const [currentUser, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  return (
    <RequestsWorkspace
      currentUser={currentUser}
      searchParams={params ?? {}}
      overlay={
        <RequestForm
          initialItemId={params?.itemId}
          requesterName={currentUser.name}
        />
      }
    />
  );
}
