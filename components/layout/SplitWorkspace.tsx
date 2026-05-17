import type { ReactNode } from "react";
import { WorkspaceLayout } from "./WorkspaceLayout";

export function SplitWorkspace({
  children,
  panel,
}: {
  children: ReactNode;
  panel?: {
    children: ReactNode;
    closeHref: string;
    title: string;
  };
}) {
  return (
    <WorkspaceLayout sidePanel={panel}>{children}</WorkspaceLayout>
  );
}
