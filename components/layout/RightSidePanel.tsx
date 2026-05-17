"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { useState } from "react";

export function RightSidePanel({
  children,
  closeHref,
  title,
}: {
  children: React.ReactNode;
  closeHref: string;
  title: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      aria-label={title}
      className={`right-side-panel ${collapsed ? "is-collapsed" : ""} ${
        expanded ? "is-expanded" : ""
      }`}
    >
      <div className="right-panel-rail">
        <button
          aria-label={collapsed ? "Expand detail panel" : "Collapse detail panel"}
          className="icon-button"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? <ChevronsLeft /> : <ChevronsRight />}
        </button>
      </div>

      {!collapsed ? (
        <div className="right-panel-content">
          <div className="right-panel-header">
            <strong>{title}</strong>
            <div className="button-row">
              <button
                aria-label={expanded ? "Use default panel width" : "Expand panel width"}
                className="icon-button"
                onClick={() => setExpanded((value) => !value)}
                type="button"
              >
                {expanded ? <ChevronsRight /> : <ChevronsLeft />}
              </button>
              <Link
                aria-label="Close detail panel"
                className="icon-button"
                href={closeHref}
              >
                <X />
              </Link>
            </div>
          </div>
          <div className="right-panel-scroll">{children}</div>
        </div>
      ) : null}
    </aside>
  );
}
