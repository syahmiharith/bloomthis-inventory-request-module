import type { ReactNode } from "react";
import {
  ResizableDataTable,
  type ResizableColumn,
} from "./ResizableDataTable";

export function DataTable({
  children,
  className = "",
  columns,
  tableId,
}: {
  children: ReactNode;
  className?: string;
  columns?: ResizableColumn[];
  tableId?: string;
}) {
  if (columns && tableId) {
    return (
      <ResizableDataTable
        className={className}
        columns={columns}
        tableId={tableId}
      >
        {children}
      </ResizableDataTable>
    );
  }

  return (
    <div className="table-wrap compact data-table-wrap">
      <table className={`data-table ${className}`.trim()}>{children}</table>
    </div>
  );
}
