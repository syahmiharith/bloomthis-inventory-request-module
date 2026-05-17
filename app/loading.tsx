import { KpiSkeletonGrid, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="page-scroll main-scroll-region route-page dashboard-route">
      <section>
        <div className="route-heading dashboard-heading">
          <div className="skeleton-stack">
            <span className="skeleton skeleton-line medium" />
            <span className="skeleton skeleton-line wide" />
          </div>
        </div>
        <KpiSkeletonGrid />
        <section className="panel">
          <div className="panel-header">
            <span className="skeleton skeleton-line medium" />
          </div>
          <TableSkeleton columns={5} rows={5} />
        </section>
      </section>
    </main>
  );
}
