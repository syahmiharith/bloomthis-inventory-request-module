"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SidePanelResizeHandle } from "./SidePanelResizeHandle";

const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 360;
const MAX_WIDTH = 720;
const STORAGE_KEY = "detail-side-panel-width";

export function DetailSidePanel({
  children,
  closeHref,
  footer,
  title,
}: {
  children: React.ReactNode;
  closeHref: string;
  footer?: React.ReactNode;
  title: string;
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const storedWidth = localStorage.getItem(STORAGE_KEY);
    if (storedWidth) {
      setWidth(clampPanelWidth(Number(storedWidth)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const style = useMemo(() => ({ flexBasis: width, width }), [width]);

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(max-width: 760px)").matches) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing");
    const startX = event.clientX;
    const startWidth = width;

    const handleMove = (moveEvent: PointerEvent) => {
      setWidth(clampPanelWidth(startWidth + startX - moveEvent.clientX));
    };
    const handleUp = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <aside aria-label={title} className="detail-side-panel" style={style}>
      <SidePanelResizeHandle onPointerDown={startResize} />
      <div className="detail-side-panel-header">
        <strong>{title}</strong>
        <Link
          aria-label="Close detail panel"
          className="icon-button"
          href={closeHref}
        >
          <X aria-hidden="true" />
        </Link>
      </div>
      <div className="detail-side-panel-scroll">{children}</div>
      {footer ? <div className="detail-side-panel-footer">{footer}</div> : null}
    </aside>
  );
}

export function clampPanelWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}
