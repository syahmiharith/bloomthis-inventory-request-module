import type { ReactNode } from "react";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <span aria-hidden="true" className={`skeleton ${className}`.trim()} />;
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="kpi-card kpi-skeleton-card" key={index}>
          <SkeletonBlock className="skeleton-icon" />
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line short" />
            <SkeletonBlock className="skeleton-line large" />
            <SkeletonBlock className="skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterToolbarSkeleton() {
  return (
    <div className="stock-toolbar" aria-hidden="true">
      <SkeletonBlock className="skeleton-input grow" />
      <SkeletonBlock className="skeleton-input select" />
      <SkeletonBlock className="skeleton-button" />
    </div>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="table-wrap skeleton-table-wrap" aria-hidden="true">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={index}>
                <SkeletonBlock className="skeleton-line tiny" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <td key={columnIndex}>
                  <SkeletonBlock
                    className={
                      columnIndex === 0
                        ? "skeleton-line"
                        : "skeleton-line medium"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SidePanelSkeleton() {
  return (
    <aside className="detail-side-panel skeleton-side-panel" aria-hidden="true">
      <span className="side-panel-resize-handle" />
      <div className="detail-side-panel-header">
        <SkeletonBlock className="skeleton-line medium" />
        <SkeletonBlock className="skeleton-icon small" />
      </div>
      <div className="detail-side-panel-scroll">
        <div className="panel-detail-stack">
          <section className="panel skeleton-panel-section">
            <SkeletonBlock className="skeleton-line medium" />
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line short" />
          </section>
          <section className="panel skeleton-panel-section">
            <SkeletonBlock className="skeleton-line medium" />
            <SkeletonBlock className="skeleton-line" />
            <SkeletonBlock className="skeleton-line short" />
          </section>
        </div>
      </div>
    </aside>
  );
}

export function ModalSkeleton() {
  return (
    <div className="form-modal-backdrop" aria-hidden="true">
      <section className="form-modal">
        <div className="form-modal-header">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line medium" />
            <SkeletonBlock className="skeleton-line" />
          </div>
          <SkeletonBlock className="skeleton-icon small" />
        </div>
        <div className="form-modal-body">
          <div className="form-grid two-column-form">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="field" key={index}>
                <SkeletonBlock className="skeleton-line short" />
                <SkeletonBlock className="skeleton-input" />
              </div>
            ))}
          </div>
          <div className="modal-skeleton-footer">
            <SkeletonBlock className="skeleton-button" />
            <SkeletonBlock className="skeleton-button primary" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceTableSkeleton({
  children,
  titleWidth = "medium",
  withPanel = false,
}: {
  children?: ReactNode;
  titleWidth?: "short" | "medium";
  withPanel?: boolean;
}) {
  return (
    <div className="workspace-layout">
      <div className="workspace-layout-main">
        <main className="page-scroll main-scroll-region route-page">
          <section>
            <div className="route-heading skeleton-route-heading">
              <div className="skeleton-stack">
                <SkeletonBlock className={`skeleton-line ${titleWidth}`} />
                <SkeletonBlock className="skeleton-line wide" />
              </div>
              <SkeletonBlock className="skeleton-button" />
            </div>
            <section className="panel">
              <FilterToolbarSkeleton />
              <TableSkeleton />
            </section>
          </section>
          {children}
        </main>
      </div>
      {withPanel ? <SidePanelSkeleton /> : null}
    </div>
  );
}
