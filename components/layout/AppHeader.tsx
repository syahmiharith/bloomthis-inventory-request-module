"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
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
  const meta = useMemo(
    () =>
      pageMeta.find((entry) => pathname.startsWith(entry.prefix)) ??
      pageMeta[0],
    [pathname],
  );

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
        <div className="viewer-chip" data-testid="profile-summary">
          <strong>{initials(currentUser.name)}</strong>
          <span>{currentUser.role === "admin" ? "Admin" : "Employee"}</span>
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
