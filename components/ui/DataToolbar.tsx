import type { ReactNode } from "react";

export function DataToolbar({ children }: { children: ReactNode }) {
  return <div className="stock-toolbar data-toolbar">{children}</div>;
}
