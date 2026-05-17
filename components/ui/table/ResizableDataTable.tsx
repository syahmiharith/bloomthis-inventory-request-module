"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type ResizableColumn = {
  id: string;
  defaultWidth: number;
  minWidth: number;
};

export function ResizableDataTable({
  children,
  className = "",
  columns,
  tableId,
}: {
  children: ReactNode;
  className?: string;
  columns: ResizableColumn[];
  tableId: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const columnMap = useMemo(
    () => new Map(columns.map((col) => [col.id, col])),
    [columns],
  );

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    for (const column of columns) {
      const stored = localStorage.getItem(columnStorageKey(tableId, column.id));
      const width = clampColumnWidth(
        stored ? Number(stored) : column.defaultWidth,
        column.minWidth,
      );
      shell.style.setProperty(columnVar(column.id), `${width}px`);
    }
  }, [columns, tableId]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const updateConstrainedState = () => {
      shell.classList.toggle(
        "is-constrained",
        shell.scrollWidth > shell.clientWidth + 4,
      );
    };

    updateConstrainedState();
    const observer = new ResizeObserver(updateConstrainedState);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="table-wrap compact data-table-wrap resizable-table-shell"
      data-table-id={tableId}
      ref={shellRef}
    >
      <table className={`data-table resizable-table ${className}`.trim()}>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.id}
              style={{
                width: `var(${columnVar(column.id)}, ${column.defaultWidth}px)`,
              }}
            />
          ))}
        </colgroup>
        {children}
      </table>
      <span
        aria-hidden="true"
        data-column-map={Array.from(columnMap.keys()).join(",")}
        hidden
      />
    </div>
  );
}

export function ColumnResizeHandle({
  columnId,
  minWidth,
  tableId,
}: {
  columnId: string;
  minWidth: number;
  tableId: string;
}) {
  function setWidth(handle: HTMLElement, width: number) {
    const shell = handle.closest<HTMLElement>(".resizable-table-shell");
    const clamped = clampColumnWidth(width, minWidth);
    shell?.style.setProperty(columnVar(columnId), `${clamped}px`);
    localStorage.setItem(columnStorageKey(tableId, columnId), String(clamped));
  }

  function currentWidth(handle: HTMLElement) {
    const header = handle.closest("th");
    return header?.getBoundingClientRect().width ?? minWidth;
  }

  function startResize(event: ReactPointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing");
    const startX = event.clientX;
    const startWidth = currentWidth(handle);

    const handleMove = (moveEvent: PointerEvent) => {
      setWidth(handle, startWidth + moveEvent.clientX - startX);
    };
    const handleUp = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const delta = event.key === "ArrowRight" ? 16 : -16;
    setWidth(event.currentTarget, currentWidth(event.currentTarget) + delta);
  }

  return (
    <span
      aria-label="Resize column"
      aria-orientation="vertical"
      className="column-resize-handle"
      data-row-action
      onKeyDown={handleKeyDown}
      onPointerDown={startResize}
      role="separator"
      tabIndex={0}
    />
  );
}

function columnVar(columnId: string) {
  return `--col-${columnId}`;
}

function columnStorageKey(tableId: string, columnId: string) {
  return `${tableId}:column:${columnId}`;
}

function clampColumnWidth(width: number, minWidth: number) {
  return Math.max(
    minWidth,
    Number.isFinite(width) ? Math.round(width) : minWidth,
  );
}
