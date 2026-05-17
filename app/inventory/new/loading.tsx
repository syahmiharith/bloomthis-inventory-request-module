import { ModalSkeleton } from "@/components/ui/Skeleton";

export default function NewInventoryItemLoading() {
  return (
    <main className="page-scroll main-scroll-region route-page modal-route">
      <ModalSkeleton />
    </main>
  );
}
