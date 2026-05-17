import type { ReactNode } from "react";
import type { User } from "@/db/schema";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppShell({
  children,
  currentUser,
  demoUsers,
}: {
  children: ReactNode;
  currentUser: User;
  demoUsers: User[];
}) {
  return (
    <div className="app-shell" data-testid="app-shell">
      <AppSidebar currentUser={currentUser} />
      <div className="center-region" data-testid="center-region">
        <AppHeader currentUser={currentUser} demoUsers={demoUsers} />
        <div className="content-region">{children}</div>
      </div>
    </div>
  );
}
