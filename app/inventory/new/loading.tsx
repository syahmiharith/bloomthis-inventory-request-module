import { ModalSkeleton, WorkspaceTableSkeleton } from "@/components/ui/Skeleton";

export default function NewInventoryItemLoading() {
  return (
    <WorkspaceTableSkeleton>
      <ModalSkeleton />
    </WorkspaceTableSkeleton>
  );
}
