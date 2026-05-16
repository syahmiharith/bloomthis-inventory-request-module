import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/layout/AppSidebar";
import type { User } from "@/db/schema";

vi.mock("next/navigation", () => ({
  usePathname: () => "/inventory",
}));

const baseUser = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Demo User",
  email: "demo@inventory.local",
  department: "Operations",
  createdAt: new Date(),
} satisfies Omit<User, "role">;

describe("AppSidebar", () => {
  afterEach(cleanup);

  it("shows admin inventory creation navigation to admins", () => {
    render(<AppSidebar currentUser={{ ...baseUser, role: "admin" }} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Inventory" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Add Inventory Item" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Requests" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New Request" })).toBeVisible();
  });

  it("hides admin inventory creation navigation from employees", () => {
    render(<AppSidebar currentUser={{ ...baseUser, role: "employee" }} />);

    expect(
      screen.queryByRole("link", { name: "Add Inventory Item" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New Request" })).toBeVisible();
  });
});
