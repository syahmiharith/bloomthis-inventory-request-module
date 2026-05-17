import type { ReactNode } from "react";
import { DetailSidePanel } from "./DetailSidePanel";

export function WorkspaceLayout({
  children,
  sidePanel,
}: {
  children: ReactNode;
  sidePanel?: {
    children: ReactNode;
    closeHref: string;
    footer?: ReactNode;
    title: string;
  };
}) {
  return (
    <div className="workspace-layout">
      <div className="workspace-layout-main">{children}</div>
      {sidePanel ? (
        <DetailSidePanel
          closeHref={sidePanel.closeHref}
          footer={sidePanel.footer}
          title={sidePanel.title}
        >
          {sidePanel.children}
        </DetailSidePanel>
      ) : null}
    </div>
  );
}
