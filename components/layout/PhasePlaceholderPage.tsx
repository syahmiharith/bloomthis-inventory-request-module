import type { ReactNode } from "react";

export function PhasePlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main
      className="page-scroll main-scroll-region route-page"
      data-testid="main-scroll-region"
    >
      <section className="page-state" data-testid="phase-placeholder-page">
        <div className="route-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        <div className="panel">
          <p className="empty-state">{children}</p>
        </div>
      </section>
    </main>
  );
}
