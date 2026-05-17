import type { ReactNode } from "react";

export function DataTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="table-wrap compact data-table-wrap">
      <table className={`data-table ${className}`.trim()}>{children}</table>
    </div>
  );
}
