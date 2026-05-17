"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/db/schema";

const MIN_WIDTH = 220;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 68;

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
  },
  {
    href: "/requests",
    label: "Requests",
    icon: ClipboardList,
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }

  if (href === "/inventory") {
    return pathname === "/inventory" || pathname.startsWith("/inventory/");
  }

  if (href === "/requests") {
    return pathname === "/requests" || pathname.startsWith("/requests/");
  }

  return pathname === href;
}

export function AppSidebar({ currentUser }: { currentUser: User }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [width, setWidth] = useState(248);

  useEffect(() => {
    const storedCollapsed = localStorage.getItem("sidebar-collapsed");
    const storedWidth = localStorage.getItem("sidebar-width");
    if (storedCollapsed) {
      setCollapsed(storedCollapsed === "true");
    }
    if (storedWidth) {
      setWidth(clampSidebarWidth(Number(storedWidth)));
    }
  }, []);

  useEffect(() => {
    const toggle = () => setMobileOpen((value) => !value);
    window.addEventListener("toggle-mobile-sidebar", toggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", toggle);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-width", String(width));
  }, [width]);

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : width;
  const style = useMemo(() => ({ width: effectiveWidth }), [effectiveWidth]);
  const visibleNavItems = useMemo(() => navItems, []);

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (collapsed) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing");
    const startX = event.clientX;
    const startWidth = width;

    const handleMove = (moveEvent: PointerEvent) => {
      setWidth(clampSidebarWidth(startWidth + moveEvent.clientX - startX));
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
    <aside
      className={`sidebar-region ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "is-mobile-open" : ""
      }`}
      data-testid={collapsed ? "collapsed-sidebar" : "expanded-sidebar"}
      style={style}
    >
      <div className="sidebar-inner" data-testid="sidebar">
        <Link className="sidebar-brand" href="/" title="BloomThis Internal Tool">
          <span className="brand-mark">B</span>
          {!collapsed ? <strong>BloomThis Internal Tool</strong> : null}
        </Link>

        <div
          className="sidebar-scroll-region"
          data-testid="sidebar-scroll-region"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className="sidebar-link"
                data-testid={`sidebar-nav-${item.label
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
                title={item.label}
              >
                <Icon
                  data-testid={`sidebar-nav-icon-${item.label
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </div>

        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="sidebar-collapse-button"
          data-testid="sidebar-collapse-button"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <div
        aria-hidden="true"
        className="sidebar-resize-handle"
        data-testid="sidebar-resize-handle"
        onPointerDown={startResize}
      />
    </aside>
  );
}

export function clampSidebarWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}
