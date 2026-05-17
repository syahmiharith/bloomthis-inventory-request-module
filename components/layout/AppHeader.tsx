"use client";

import type { User } from "@/db/schema";
import { DemoUserSwitcher } from "@/components/ui/DemoUserSwitcher";

export function AppHeader({
  currentUser,
  demoUsers,
}: {
  currentUser: User;
  demoUsers: User[];
}) {
  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-title">
        <div>
          <span className="breadcrumb">Internal Inventory Operations</span>
          <h1>BloomThis</h1>
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
