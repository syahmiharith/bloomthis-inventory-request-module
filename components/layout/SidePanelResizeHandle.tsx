"use client";

export function SidePanelResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      aria-label="Resize detail panel"
      className="side-panel-resize-handle"
      onPointerDown={onPointerDown}
      role="separator"
      tabIndex={0}
    />
  );
}
