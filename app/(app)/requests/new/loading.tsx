import {
  ModalSkeleton,
  WorkspaceTableSkeleton,
} from "@/components/ui/skeleton/Skeleton";

export default function NewRequestLoading() {
  return (
    <WorkspaceTableSkeleton titleWidth="short">
      <ModalSkeleton />
    </WorkspaceTableSkeleton>
  );
}
