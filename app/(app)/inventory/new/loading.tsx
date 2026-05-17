import {
  ModalSkeleton,
  WorkspaceTableSkeleton,
} from "@/components/ui/skeleton/Skeleton";

export default function NewInventoryItemLoading() {
  return (
    <WorkspaceTableSkeleton>
      <ModalSkeleton />
    </WorkspaceTableSkeleton>
  );
}
