"use client";

import { Bell, ChevronDown, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@/db/schema";
import { DemoUserSwitcher } from "@/components/ui/DemoUserSwitcher";

const pageMeta: Array<{ prefix: string; title: string; breadcrumb?: string }> =
  [
    { prefix: "/inventory/new", title: "Add Inventory Item" },
    { prefix: "/inventory", title: "Inventory" },
    { prefix: "/requests/new", title: "New Request" },
    { prefix: "/requests", title: "Requests" },
    { prefix: "/dashboard", title: "Dashboard" },
    { prefix: "/", title: "Dashboard" },
  ];

export function AppHeader({
  currentUser,
  demoUsers,
}: {
  currentUser: User;
  demoUsers: User[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = useMemo(
    () =>
      pageMeta.find((entry) => pathname.startsWith(entry.prefix)) ??
      pageMeta[0],
    [pathname],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-title">
        <button
          aria-label="Open menu"
          className="icon-button"
          onClick={() =>
            window.dispatchEvent(new Event("toggle-mobile-sidebar"))
          }
          type="button"
        >
          <Menu />
        </button>
        <div>
          {meta.breadcrumb ? (
            <span className="breadcrumb">{meta.breadcrumb}</span>
          ) : null}
          <h1>{meta.title}</h1>
        </div>
      </div>

      <div className="header-actions">
        <DemoUserSwitcher
          initialUsers={demoUsers}
          initialCurrentUser={currentUser}
        />
        <button
          aria-label="Notifications"
          className="icon-button notification-button"
          type="button"
        >
          <Bell />
          <span>3</span>
        </button>
        <div className="profile-menu" ref={menuRef}>
          <button
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Open profile menu"
            className="profile-avatar-button"
            data-testid="profile-avatar-button"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {initials(currentUser.name)}
            <ChevronDown />
          </button>
          {open ? (
            <div
              className="profile-dropdown"
              data-testid="profile-dropdown"
              role="menu"
            >
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
              <span>
                {currentUser.role === "admin" ? "Operations Admin" : "Employee"}
              </span>
              <button type="button">Profile</button>
              <button type="button">Sign out</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
