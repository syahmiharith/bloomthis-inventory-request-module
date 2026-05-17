import { ModalSkeleton, WorkspaceTableSkeleton } from "@/components/ui/Skeleton";

export default function NewRequestLoading() {
  return (
    <WorkspaceTableSkeleton titleWidth="short">
      <ModalSkeleton />
    </WorkspaceTableSkeleton>
  );
}
