import type { ReactNode } from "react";

export function EmptyState({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  if (action) {
    return (
      <div className="empty-state-card">
        <p>{children}</p>
        {action}
      </div>
    );
  }

  return <p className="empty-state">{children}</p>;
}
