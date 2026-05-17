import type { ReactNode } from "react";
import { RightSidePanel } from "./RightSidePanel";

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
    <div className="split-workspace">
      <div className="split-workspace-main">{children}</div>
      {panel ? (
        <RightSidePanel closeHref={panel.closeHref} title={panel.title}>
          {panel.children}
        </RightSidePanel>
      ) : null}
    </div>
  );
}
